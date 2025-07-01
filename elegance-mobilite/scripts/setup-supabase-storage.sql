-- 🪣 CONFIGURATION SUPABASE STORAGE
-- Script pour créer et configurer les buckets

-- =================================================================
-- ÉTAPE 1: CRÉER LES BUCKETS
-- =================================================================

-- Bucket pour les avatars (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('driver-avatars', 'driver-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les documents (privé, accès contrôlé)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les photos de véhicules (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- ÉTAPE 2: POLITIQUES DE SÉCURITÉ POUR DRIVER-AVATARS
-- =================================================================

-- Les drivers peuvent uploader leur propre avatar
CREATE POLICY "Drivers can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Les drivers peuvent voir leur propre avatar
CREATE POLICY "Drivers can view own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Les drivers peuvent supprimer leur propre avatar
CREATE POLICY "Drivers can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Les admins peuvent voir tous les avatars
CREATE POLICY "Admins can view all avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-avatars'
  AND ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
);

-- =================================================================
-- ÉTAPE 3: POLITIQUES POUR DRIVER-DOCUMENTS
-- =================================================================

-- Les drivers peuvent uploader leurs propres documents
CREATE POLICY "Drivers can upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1 FROM drivers 
    WHERE user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Les drivers peuvent voir leurs propres documents
CREATE POLICY "Drivers can view own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1 FROM drivers 
    WHERE user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Les admins peuvent voir tous les documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
);

-- Les admins peuvent supprimer des documents
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
);

-- =================================================================
-- ÉTAPE 4: POLITIQUES POUR VEHICLE-PHOTOS
-- =================================================================

-- Les drivers peuvent uploader des photos de véhicules
CREATE POLICY "Drivers can upload vehicle photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-photos'
  AND EXISTS (
    SELECT 1 FROM drivers 
    WHERE user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Tous peuvent voir les photos de véhicules (public)
CREATE POLICY "Public can view vehicle photos"
ON storage.objects FOR SELECT 
USING (bucket_id = 'vehicle-photos');

-- Les drivers peuvent supprimer leurs photos
CREATE POLICY "Drivers can delete own vehicle photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vehicle-photos'
  AND EXISTS (
    SELECT 1 FROM drivers 
    WHERE user_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);

-- =================================================================
-- ÉTAPE 5: FONCTION HELPER POUR NETTOYAGE
-- =================================================================

-- Fonction pour supprimer un fichier et nettoyer les références
CREATE OR REPLACE FUNCTION delete_driver_file(
  file_bucket TEXT,
  file_path TEXT,
  driver_id_param UUID,
  document_type_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Supprimer le fichier du storage
  DELETE FROM storage.objects 
  WHERE bucket_id = file_bucket AND name = file_path;
  
  -- Nettoyer les références selon le type
  IF file_bucket = 'driver-avatars' THEN
    UPDATE drivers SET avatar_url = NULL WHERE id = driver_id_param;
    success := true;
  ELSIF file_bucket = 'driver-documents' AND document_type_param IS NOT NULL THEN
    -- Supprimer de driver_documents
    DELETE FROM driver_documents 
    WHERE driver_id = driver_id_param AND document_type = document_type_param;
    
    -- Nettoyer document_urls dans drivers
    UPDATE drivers 
    SET document_urls = document_urls - document_type_param
    WHERE id = driver_id_param;
    success := true;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- ÉTAPE 6: TRIGGER POUR AUTO-NETTOYAGE
-- =================================================================

-- Fonction trigger pour nettoyer les fichiers orphelins
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un driver est supprimé, nettoyer ses fichiers
  IF TG_OP = 'DELETE' THEN
    -- Supprimer avatar
    DELETE FROM storage.objects 
    WHERE bucket_id = 'driver-avatars' 
    AND name LIKE OLD.id::text || '/%';
    
    -- Supprimer documents
    DELETE FROM storage.objects 
    WHERE bucket_id = 'driver-documents' 
    AND name LIKE OLD.id::text || '/%';
    
    -- Supprimer photos véhicules
    DELETE FROM storage.objects 
    WHERE bucket_id = 'vehicle-photos' 
    AND name LIKE OLD.id::text || '/%';
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
CREATE TRIGGER cleanup_driver_files_on_delete
  AFTER DELETE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_files();

-- =================================================================
-- MESSAGE FINAL
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '🪣 CONFIGURATION STORAGE TERMINÉE!';
  RAISE NOTICE '✅ Buckets créés: driver-avatars, driver-documents, vehicle-photos';
  RAISE NOTICE '✅ Politiques de sécurité configurées';
  RAISE NOTICE '✅ Fonctions de nettoyage ajoutées';
  RAISE NOTICE '✅ Triggers de suppression automatique';
  RAISE NOTICE '';
  RAISE NOTICE '📝 RÉSUMÉ SÉCURITÉ:';
  RAISE NOTICE '- Avatars: Public, contrôlé par user_id';
  RAISE NOTICE '- Documents: Privé, accès driver + admin';
  RAISE NOTICE '- Photos véhicules: Public lecture, contrôlé upload';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PRÊT POUR LES UPLOADS!';
END $$;
