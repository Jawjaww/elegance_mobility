-- 🔍 DIAGNOSTIC SIMPLE STORAGE DRIVER-DOCUMENTS
-- Pour vérifier si les politiques permettent l'upload

-- Test avec l'utilisateur actuel
SELECT 
  'UTILISATEUR ACTUEL' as test,
  auth.uid() as user_id,
  (auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text as role;

-- Test: trouver le driver correspondant
SELECT 
  'DRIVER CORRESPONDANT' as test,
  id as driver_id,
  user_id
FROM drivers 
WHERE user_id = auth.uid();

-- Test: simulation politique avec filename d'exemple
WITH test_data AS (
  SELECT 
    'a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card_1753355150617.png' as filename,
    SPLIT_PART('a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card_1753355150617.png', '_', 1) as extracted_driver_id
)
SELECT 
  'TEST EXTRACTION' as test,
  filename,
  extracted_driver_id,
  CASE 
    WHEN extracted_driver_id IN (SELECT id::text FROM drivers WHERE user_id = auth.uid())
    THEN '✅ UPLOAD AUTORISÉ'
    ELSE '❌ UPLOAD REFUSÉ'
  END as upload_status
FROM test_data;

-- Message de diagnostic
DO $$
BEGIN
  RAISE NOTICE '🔍 DIAGNOSTIC TERMINÉ - Regardez les résultats ci-dessus';
  RAISE NOTICE 'Si "UPLOAD AUTORISÉ" = l''upload devrait fonctionner';
  RAISE NOTICE 'Si "UPLOAD REFUSÉ" = il faut corriger les politiques';
END $$;
