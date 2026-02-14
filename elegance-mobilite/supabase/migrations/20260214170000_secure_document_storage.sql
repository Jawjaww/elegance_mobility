-- Migration: Sécurisation complète du système de documents drivers (RGPD compliant)
-- Created: 2026-02-14
-- Purpose: Créer un système de stockage sécurisé pour documents sensibles avec RLS strict

-- ============================================
-- 1. CRÉATION DU BUCKET (privé par défaut)
-- ============================================

-- Insert bucket if not exists
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents', 
  NULL,
  NOW(),
  NOW(),
  false, -- PRIVATE bucket
  false,
  10485760, -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[];

-- ============================================
-- 2. MISE À JOUR DE LA CONTRAINTE validation_status
-- ============================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.driver_documents 
DROP CONSTRAINT IF EXISTS driver_documents_validation_status_check;

-- Ajouter la nouvelle contrainte avec 'pending_temp'
ALTER TABLE public.driver_documents 
ADD CONSTRAINT driver_documents_validation_status_check 
CHECK (validation_status = ANY (ARRAY['pending'::text, 'pending_temp'::text, 'approved'::text, 'rejected'::text]));

-- ============================================
-- 3. POLICIES STORAGE - UPLOAD SÉCURISÉ
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "drivers_upload_own_docs" ON storage.objects;
DROP POLICY IF EXISTS "drivers_view_own_docs" ON storage.objects;
DROP POLICY IF EXISTS "drivers_delete_own_docs" ON storage.objects;
DROP POLICY IF EXISTS "admin_all_access_docs" ON storage.objects;

-- Policy: Les drivers peuvent UPLOADER dans leur propre dossier
-- Format: driver_id/document_type/filename
CREATE POLICY "drivers_upload_own_docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' 
  AND (
    -- Vérifie que le premier segment du path = driver_id du user connecté
    split_part(name, '/', 1) = (
      SELECT id::text 
      FROM public.drivers 
      WHERE user_id = auth.uid()
    )
    -- OU c'est un upload temporaire (tmp/user_id/...)
    OR (
      split_part(name, '/', 1) = 'tmp'
      AND split_part(name, '/', 2) = auth.uid()::text
    )
    -- OU l'utilisateur est admin
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data->>'role' IN ('app_admin', 'app_super_admin')
    )
  )
);

-- Policy: Les drivers peuvent VOIR leurs propres documents
CREATE POLICY "drivers_view_own_docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (
    split_part(name, '/', 1) = (
      SELECT id::text 
      FROM public.drivers 
      WHERE user_id = auth.uid()
    )
    OR (
      split_part(name, '/', 1) = 'tmp'
      AND split_part(name, '/', 2) = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data->>'role' IN ('app_admin', 'app_super_admin')
    )
  )
);

-- Policy: Les drivers peuvent SUPPRIMER leurs propres documents
CREATE POLICY "drivers_delete_own_docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND (
    split_part(name, '/', 1) = (
      SELECT id::text 
      FROM public.drivers 
      WHERE user_id = auth.uid()
    )
    OR (
      split_part(name, '/', 1) = 'tmp'
      AND split_part(name, '/', 2) = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_app_meta_data->>'role' IN ('app_admin', 'app_super_admin')
    )
  )
);

-- Policy: Admins ont accès complet
CREATE POLICY "admin_all_access_docs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' IN ('app_admin', 'app_super_admin')
  )
)
WITH CHECK (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' IN ('app_admin', 'app_super_admin')
  )
);

-- ============================================
-- 4. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction: Associer les documents temporaires après création du driver
CREATE OR REPLACE FUNCTION public.associate_temp_documents(p_user_id uuid, p_driver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_temp_path text;
  v_new_path text;
  v_doc_type text;
  v_file_name text;
BEGIN
  -- Déplacer chaque fichier temporaire vers le dossier du driver
  FOR v_temp_path, v_doc_type, v_file_name IN
    SELECT 
      file_url,
      document_type,
      file_name
    FROM public.driver_documents
    WHERE driver_id IS NULL
    AND file_url LIKE 'tmp/' || p_user_id || '/%'
  LOOP
    -- Construire le nouveau path
    v_new_path := p_driver_id || '/' || v_doc_type || '/' || split_part(v_temp_path, '/', -1);
    
    -- Déplacer le fichier dans storage (copier + supprimer)
    -- Note: Cette opération nécessite une Edge Function ou un service externe
    -- car les triggers storage ne peuvent pas faire de copie directe
    
    -- Mettre à jour le record
    UPDATE public.driver_documents
    SET 
      driver_id = p_driver_id,
      file_url = v_new_path,
      validation_status = 'pending'
    WHERE file_url = v_temp_path;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'associated_count', v_count,
    'message', v_count || ' documents temporaires associés au driver'
  );
END;
$$;

-- Fonction: Nettoyer les documents orphelins (RGPD - droit à l'effacement)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_documents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_record record;
BEGIN
  -- Supprimer les documents sans driver_id et vieux de plus de 24h
  FOR v_record IN
    SELECT file_url
    FROM public.driver_documents
    WHERE driver_id IS NULL
    AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Supprimer de storage
    DELETE FROM storage.objects
    WHERE bucket_id = 'driver-documents'
    AND name = v_record.file_url;
    
    -- Supprimer le record
    DELETE FROM public.driver_documents
    WHERE file_url = v_record.file_url;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Fonction: Obtenir l'URL signée d'un document (sécurisé)
CREATE OR REPLACE FUNCTION public.get_document_signed_url(p_document_id uuid, p_expiry_seconds integer DEFAULT 3600)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_file_path text;
  v_driver_id uuid;
  v_user_id uuid;
BEGIN
  -- Récupérer le document
  SELECT file_url, driver_id
  INTO v_file_path, v_driver_id
  FROM public.driver_documents
  WHERE id = p_document_id;
  
  IF v_file_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Vérifier les permissions
  SELECT user_id INTO v_user_id
  FROM public.drivers
  WHERE id = v_driver_id;
  
  -- Seul le propriétaire ou un admin peut obtenir l'URL
  IF v_user_id != auth.uid() 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_app_meta_data->>'role' IN ('app_admin', 'app_super_admin')
  ) THEN
    RETURN NULL;
  END IF;
  
  -- La génération de signed URL se fait côté client via storage.createSignedUrl()
  -- Cette fonction vérifie juste les permissions
  RETURN v_file_path;
END;
$$;

-- ============================================
-- 5. INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_driver_documents_status 
ON public.driver_documents(validation_status);

CREATE INDEX IF NOT EXISTS idx_driver_documents_created_at 
ON public.driver_documents(created_at);

CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name 
ON storage.objects(bucket_id, name);

-- ============================================
-- 6. COMMENTAIRES RGPD
-- ============================================

COMMENT ON TABLE public.driver_documents IS 'Documents sensibles des chauffeurs (permis, carte VTC, etc.) - RGPD: conservation limitée, accès restreint';
COMMENT ON COLUMN public.driver_documents.file_url IS 'Chemin du fichier dans le bucket storage privé - accessible uniquement via signed URL';
COMMENT ON COLUMN public.driver_documents.validation_status IS 'Statut: pending=uploadé, pending_temp=upload temporaire avant création driver, approved=validé, rejected=rejeté';
COMMENT ON COLUMN public.driver_documents.created_at IS 'Date de création - RGPD: permet de calculer la durée de conservation';

-- ============================================
-- 7. CRON JOB POUR NETTOYAGE (optionnel - nécessite pg_cron)
-- ============================================

-- Décommenter si pg_cron est activé sur le projet
-- SELECT cron.schedule('cleanup-orphaned-docs', '0 2 * * *', 'SELECT cleanup_orphaned_documents();');
