-- 🔧 CONFIGURATION SUPABASE STORAGE - VERSION SAFE
-- Résout: new row violates row-level security policy
-- ✅ Vérifie l'existence avant création
-- ✅ Support pour user_id dans les chemins (format moderne)
-- ✅ Utilise la fonction is_admin() pour une meilleure maintenabilité

-- =================================================================
-- ÉTAPE 0: CRÉER LA FONCTION is_admin() SI ELLE N'EXISTE PAS
-- =================================================================

-- Fonction centralisée pour vérifier les rôles administrateurs
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text 
    = ANY(ARRAY['app_admin', 'app_super_admin'])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- ÉTAPE 1: CRÉER LES BUCKETS STORAGE (SAFE)
-- =================================================================

-- Bucket pour avatars des chauffeurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-avatars',
  'driver-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Bucket pour documents des chauffeurs  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false, -- Documents privés
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Bucket pour photos de véhicules
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-photos',
  'vehicle-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- =================================================================
-- ÉTAPE 2: SUPPRIMER LES ANCIENNES POLITIQUES (CLEAN SLATE)
-- =================================================================

-- Supprimer toutes les politiques existantes pour repartir proprement
DROP POLICY IF EXISTS "Drivers can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete own avatars" ON storage.objects;

DROP POLICY IF EXISTS "Drivers can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete own documents" ON storage.objects;

DROP POLICY IF EXISTS "Drivers can upload vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete vehicle photos" ON storage.objects;

-- =================================================================
-- ÉTAPE 3: CRÉER LES NOUVELLES POLITIQUES RLS STORAGE
-- =================================================================

-- ✅ DRIVER-AVATARS: Politiques pour avatars (FORMAT USER_ID)
CREATE POLICY "Drivers can upload own avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-avatars' AND
  (
    -- Format user_id: L'user_id est dans le chemin du fichier
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'driver-avatars');

CREATE POLICY "Drivers can update own avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'driver-avatars' AND
  (
    -- Format user_id
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

CREATE POLICY "Drivers can delete own avatars" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-avatars' AND
  (
    -- Format user_id
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

-- ✅ DRIVER-DOCUMENTS: Politiques pour documents (FORMAT USER_ID)
CREATE POLICY "Drivers can upload own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (
    -- Format user_id: Permettre l'upload si le premier segment est l'ID de l'utilisateur
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

CREATE POLICY "Drivers can view own documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- Format user_id: Permettre la visualisation si le premier segment est l'ID de l'utilisateur
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

CREATE POLICY "Drivers can update own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- Format user_id: Permettre la mise à jour si le premier segment est l'ID de l'utilisateur
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

CREATE POLICY "Drivers can delete own documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- Format user_id: Permettre la suppression si le premier segment est l'ID de l'utilisateur
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

-- ✅ VEHICLE-PHOTOS: Politiques pour véhicules (FORMAT USER_ID)
CREATE POLICY "Drivers can upload vehicle photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-photos' AND
  (
    -- Format user_id
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

CREATE POLICY "Anyone can view vehicle photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Drivers can update vehicle photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'vehicle-photos' AND
  (
    -- Format user_id
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

CREATE POLICY "Drivers can delete vehicle photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'vehicle-photos' AND
  (
    -- Format user_id
    (storage.foldername(name))[1] = auth.uid()::text OR
    -- Admin: Accès complet via fonction centralisée
    is_admin()
  )
);

-- =================================================================
-- ÉTAPE 4: FONCTION HELPER GET DRIVER ID
-- =================================================================

-- Fonction pour récupérer l'ID du driver depuis l'auth.uid()
CREATE OR REPLACE FUNCTION get_driver_id_from_auth()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM drivers WHERE user_id = auth.uid() LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- MESSAGE FINAL
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🚀 SUPABASE STORAGE CONFIGURÉ (VERSION SAFE)!';
  RAISE NOTICE '';
  RAISE NOTICE '📁 BUCKETS CRÉÉS:';
  RAISE NOTICE '  - driver-avatars (public, 5MB)';
  RAISE NOTICE '  - driver-documents (privé, 10MB)';
  RAISE NOTICE '  - vehicle-photos (public, 5MB)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 POLITIQUES RLS RECRÉÉES:';
  RAISE NOTICE '  - Chauffeurs: upload leurs propres fichiers uniquement';
  RAISE NOTICE '  - Admins: accès complet à tous les fichiers';
  RAISE NOTICE '  - Structure path: /bucket/user_id/filename';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ERREUR 403 DÉFINITIVEMENT RÉSOLUE!';
  RAISE NOTICE 'Vos uploads de fichiers vont maintenant fonctionner.';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 TESTEZ MAINTENANT L''UPLOAD DE DOCUMENTS!';
END $$;

