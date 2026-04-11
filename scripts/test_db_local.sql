-- Test complet du système de documents
-- À exécuter dans psql

DO $$
DECLARE
  v_user_id uuid;
  v_driver_id uuid;
  v_future_date date;
BEGIN
  -- Date future pour les expirations
  v_future_date := CURRENT_DATE + INTERVAL '2 years';
  
  RAISE NOTICE '🧪 Test du système de documents sécurisé';
  RAISE NOTICE '==========================================';
  
  -- 1. Vérifier le bucket
  RAISE NOTICE '1️⃣ Vérification du bucket driver-documents...';
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'driver-documents' AND public = false) THEN
    RAISE NOTICE '✅ Bucket privé trouvé';
  ELSE
    RAISE EXCEPTION '❌ Bucket manquant ou public';
  END IF;
  
  -- 2. Vérifier la contrainte validation_status
  RAISE NOTICE '2️⃣ Vérification de la contrainte validation_status...';
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'driver_documents'::regclass 
    AND conname = 'driver_documents_validation_status_check'
    AND pg_get_constraintdef(oid) LIKE '%pending_temp%'
  ) THEN
    RAISE NOTICE '✅ Contrainte inclut pending_temp';
  ELSE
    RAISE EXCEPTION '❌ Contrainte ne supporte pas pending_temp';
  END IF;
  
  -- 3. Vérifier les policies storage
  RAISE NOTICE '3️⃣ Vérification des policies storage...';
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'drivers_upload_own_docs'
  ) THEN
    RAISE NOTICE '✅ Policy upload trouvée';
  ELSE
    RAISE EXCEPTION '❌ Policy upload manquante';
  END IF;
  
  -- 4. Créer un utilisateur de test
  RAISE NOTICE '4️⃣ Création utilisateur test...';
  v_user_id := gen_random_uuid();
  
  -- Créer dans auth.users
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data
  ) VALUES (
    v_user_id, 
    'test-doc-' || extract(epoch from now())::text || '@test.com',
    crypt('test123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"role": "app_driver"}'::jsonb
  );
  
  -- Créer dans public.users (pour la FK)
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (v_user_id, now(), now());
  
  RAISE NOTICE '✅ Utilisateur créé: %', v_user_id;
  
  -- 5. Créer le profil driver
  RAISE NOTICE '5️⃣ Création driver...';
  INSERT INTO drivers (
    user_id, first_name, last_name, phone, 
    vtc_card_number, driving_license_number,
    vtc_card_expiry_date, driving_license_expiry_date,
    status, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Test',
    'Driver',
    '0612345678',
    'VTC123456',
    'DL789012',
    v_future_date,
    v_future_date,
    'incomplete',
    now(),
    now()
  )
  RETURNING id INTO v_driver_id;
  
  RAISE NOTICE '✅ Driver créé: %', v_driver_id;
  
  -- 6. Tester l'insertion d'un document
  RAISE NOTICE '6️⃣ Test insertion document...';
  INSERT INTO driver_documents (
    driver_id, document_type, file_url, file_name, 
    file_size, validation_status, upload_date
  ) VALUES (
    v_driver_id,
    'driving_license',
    v_driver_id || '/driving_license/test-document.png',
    'test-document.png',
    1024,
    'pending',
    now()
  );
  RAISE NOTICE '✅ Document inséré avec validation_status=pending';
  
  -- 7. Tester avec pending_temp
  RAISE NOTICE '7️⃣ Test avec pending_temp...';
  INSERT INTO driver_documents (
    driver_id, document_type, file_url, file_name,
    file_size, validation_status, upload_date
  ) VALUES (
    NULL, -- Pas encore de driver associé (cas temp)
    'driving_license',
    'tmp/' || v_user_id || '/driving_license/temp-doc.png',
    'temp-doc.png',
    2048,
    'pending_temp',
    now()
  );
  RAISE NOTICE '✅ Document temporaire inséré avec validation_status=pending_temp';
  
  -- 8. Vérifier les fonctions helper
  RAISE NOTICE '8️⃣ Vérification des fonctions...';
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'associate_temp_documents') THEN
    RAISE NOTICE '✅ Fonction associate_temp_documents existe';
  ELSE
    RAISE EXCEPTION '❌ Fonction associate_temp_documents manquante';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_orphaned_documents') THEN
    RAISE NOTICE '✅ Fonction cleanup_orphaned_documents existe';
  ELSE
    RAISE EXCEPTION '❌ Fonction cleanup_orphaned_documents manquante';
  END IF;
  
  -- 9. Nettoyage
  RAISE NOTICE '9️⃣ Nettoyage des données de test...';
  DELETE FROM driver_documents WHERE file_url LIKE '%test%' OR file_url LIKE '%temp%';
  DELETE FROM drivers WHERE id = v_driver_id;
  DELETE FROM public.users WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE '✅ Données de test supprimées';
  
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ TOUS LES TESTS ONT RÉUSSI !';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Configuration validée:';
  RAISE NOTICE '   - Bucket driver-documents: privé ✓';
  RAISE NOTICE '   - RLS policies: configurées ✓';
  RAISE NOTICE '   - validation_status: supporte pending_temp ✓';
  RAISE NOTICE '   - Fonctions helper: présentes ✓';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Système prêt pour Tauri Android/iOS !';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERREUR: %', SQLERRM;
  -- Cleanup en cas d'erreur
  DELETE FROM driver_documents WHERE file_url LIKE '%test%' OR file_url LIKE '%temp%';
  DELETE FROM drivers WHERE user_id = v_user_id;
  DELETE FROM public.users WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE;
END;
$$;