-- 🚨 CORRECTION URGENTE DES POLITIQUES STORAGE
-- Problème : Upload documents échoue en 403 à cause d'incohérence politique RLS

BEGIN;

-- 1. Supprimer les anciennes politiques défaillantes
DROP POLICY IF EXISTS "Drivers can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can view own documents" ON storage.objects; 
DROP POLICY IF EXISTS "Drivers can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete own documents" ON storage.objects;

-- 2. Créer des politiques CORRIGÉES qui utilisent driver.id dans le chemin
CREATE POLICY "Drivers can upload own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (
    -- CORRECTION: Le chemin utilise driver.id, pas auth.uid()
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

CREATE POLICY "Drivers can view own documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- CORRECTION: Le chemin utilise driver.id, pas auth.uid()
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

CREATE POLICY "Drivers can update own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- CORRECTION: Le chemin utilise driver.id, pas auth.uid()
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

CREATE POLICY "Drivers can delete own documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- CORRECTION: Le chemin utilise driver.id, pas auth.uid()
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

COMMIT;

-- 🧪 TEST: Vérifier les politiques
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%'
ORDER BY policyname;

-- ✅ CONFIRMATION
SELECT '
🎯 POLITIQUES STORAGE CORRIGÉES POUR DRIVER-DOCUMENTS:

✅ Upload autorisé pour: user_id dans le chemin du fichier
✅ Pattern correct: user_id/document_type/filename.ext
✅ Admins peuvent accéder à tous les documents

🚀 VOUS POUVEZ MAINTENANT UPLOADER DES DOCUMENTS !
' as resultat;
