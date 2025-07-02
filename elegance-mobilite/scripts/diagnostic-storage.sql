-- 🔍 DIAGNOSTIC SUPABASE STORAGE
-- Vérifier l'état des buckets et politiques

-- =================================================================
-- ÉTAPE 1: VÉRIFIER LES BUCKETS
-- =================================================================

SELECT 
  'BUCKETS EXISTANTS' as section,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id IN ('driver-avatars', 'driver-documents', 'vehicle-photos')
ORDER BY id;

-- =================================================================
-- ÉTAPE 2: VÉRIFIER LES POLITIQUES
-- =================================================================

SELECT 
  'POLITIQUES STORAGE' as section,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%driver%'
ORDER BY policyname;

-- =================================================================
-- ÉTAPE 3: VÉRIFIER LES TABLES DRIVER
-- =================================================================

-- Vérifier que la table drivers existe avec les nouveaux champs
SELECT 
  'COLONNES DRIVERS' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND column_name IN ('document_urls', 'avatar_url', 'emergency_contact_name', 'date_of_birth')
ORDER BY column_name;

-- Vérifier que driver_documents existe
SELECT 
  'TABLE DRIVER_DOCUMENTS' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'driver_documents'
ORDER BY ordinal_position;

-- =================================================================
-- ÉTAPE 4: TESTER LA SÉCURITÉ RLS
-- =================================================================

-- Vérifier que RLS est activé
SELECT 
  'RLS STATUS' as section,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('drivers', 'driver_documents', 'driver_vehicles')
ORDER BY tablename;

-- =================================================================
-- MESSAGE DIAGNOSTIC
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC TERMINÉ!';
  RAISE NOTICE 'Vérifiez les résultats ci-dessus pour identifier les problèmes.';
  RAISE NOTICE '';
  RAISE NOTICE '✅ À VÉRIFIER:';
  RAISE NOTICE '1. Les 3 buckets sont créés';
  RAISE NOTICE '2. Les politiques Storage existent';
  RAISE NOTICE '3. Les colonnes drivers sont ajoutées';
  RAISE NOTICE '4. La table driver_documents existe';
  RAISE NOTICE '5. RLS est activé';
END $$;
