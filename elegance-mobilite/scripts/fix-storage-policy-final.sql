-- 🚀 CORRECTION FINALE POLITIQUES STORAGE DRIVER-DOCUMENTS
-- Le problème: politique vérifie storage.foldername(name)[1] = 'driver-documents'
-- Mais le driver.id est dans le NOM du fichier, pas le dossier

-- Fichier exemple: 'driver-documents/a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card_1753355150617.png'
-- foldername(name)[1] = 'driver-documents' 
-- filename = 'a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card_1753355150617.png'
-- driver_id = SPLIT du filename avant le premier '_'

BEGIN;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Drivers can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can view own documents" ON storage.objects; 
DROP POLICY IF EXISTS "Drivers can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete own documents" ON storage.objects;

-- ✅ NOUVELLE POLITIQUE UPLOAD - Analyser le nom du fichier
CREATE POLICY "Drivers can upload own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (
    -- Extraire le driver_id du nom de fichier (avant le premier underscore)
    SPLIT_PART((storage.filename(name)), '_', 1) IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    -- Admins peuvent tout uploader
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

-- ✅ NOUVELLE POLITIQUE SELECT - Analyser le nom du fichier
CREATE POLICY "Drivers can view own documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- Extraire le driver_id du nom de fichier (avant le premier underscore)
    SPLIT_PART((storage.filename(name)), '_', 1) IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    -- Admins peuvent tout voir
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

-- ✅ NOUVELLE POLITIQUE UPDATE - Analyser le nom du fichier
CREATE POLICY "Drivers can update own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- Extraire le driver_id du nom de fichier (avant le premier underscore)
    SPLIT_PART((storage.filename(name)), '_', 1) IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    -- Admins peuvent tout modifier
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

-- ✅ NOUVELLE POLITIQUE DELETE - Analyser le nom du fichier
CREATE POLICY "Drivers can delete own documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (
    -- Extraire le driver_id du nom de fichier (avant le premier underscore)
    SPLIT_PART((storage.filename(name)), '_', 1) IN (
      SELECT id::text FROM drivers WHERE user_id = auth.uid()
    ) OR
    -- Admins peuvent tout supprimer
    ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
  )
);

COMMIT;

-- =================================================================
-- VÉRIFICATION
-- =================================================================

-- Afficher les nouvelles politiques
SELECT 
  'NOUVELLES POLITIQUES STORAGE' as info,
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%'
ORDER BY policyname;

-- Test de la logique d'extraction
SELECT 
  'TEST EXTRACTION DRIVER_ID' as test,
  'a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card_1753355150617.png' as filename_example,
  SPLIT_PART('a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card_1753355150617.png', '_', 1) as extracted_driver_id;

-- =================================================================
-- MESSAGE DE CONFIRMATION
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 POLITIQUES STORAGE DRIVER-DOCUMENTS CORRIGÉES !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Nouveau système:';
  RAISE NOTICE '   - Analyse le NOM du fichier (pas le dossier)';
  RAISE NOTICE '   - Extrait driver_id avec SPLIT_PART(filename, "_", 1)';
  RAISE NOTICE '   - Vérifie que driver_id correspond à auth.uid()';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 UPLOAD DEVRAIT MAINTENANT FONCTIONNER !';
  RAISE NOTICE '   - Driver-portal: ✅ Devrait marcher';
  RAISE NOTICE '   - Backoffice: ✅ Continue de marcher (admin)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTEZ IMMÉDIATEMENT:';
  RAISE NOTICE '   1. Upload document dans driver-portal';
  RAISE NOTICE '   2. Vérifiez la console pour erreurs';
  RAISE NOTICE '   3. Si problème: vérifiez format nom fichier';
  RAISE NOTICE '';
END $$;
