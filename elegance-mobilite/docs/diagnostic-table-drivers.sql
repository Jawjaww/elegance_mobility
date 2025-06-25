-- DIAGNOSTIC COMPLET DE LA TABLE DRIVERS
-- Script à exécuter dans l'interface Supabase SQL Editor

-- 🔍 ÉTAPE 1 : Structure complète de la table drivers
SELECT 
  'STRUCTURE TABLE DRIVERS' as info,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'drivers'
ORDER BY ordinal_position;

-- 🔍 ÉTAPE 2 : Toutes les contraintes CHECK sur drivers
SELECT 
  'CONTRAINTES CHECK' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.drivers'::regclass 
AND contype = 'c'
ORDER BY conname;

-- 🔍 ÉTAPE 3 : Contraintes NOT NULL
SELECT 
  'CONTRAINTES NOT NULL' as info,
  column_name,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'drivers'
AND is_nullable = 'NO'
ORDER BY column_name;

-- 🔍 ÉTAPE 4 : Contraintes de clés étrangères
SELECT 
  'FOREIGN KEYS' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.drivers'::regclass 
AND contype = 'f'
ORDER BY conname;

-- 🔍 ÉTAPE 5 : Test d'insertion minimaliste pour identifier le problème exact
DO $$
DECLARE
  test_user_id uuid := 'dc62bd52-0ed7-495b-9055-22635d6c5e74';  -- User ID problématique
  error_message text;
BEGIN
  -- Essayer d'insérer avec le minimum de champs
  BEGIN
    INSERT INTO public.drivers (
      user_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      'incomplete',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ TEST 1 RÉUSSI - Insertion minimale possible';
    
    -- Nettoyer immédiatement
    DELETE FROM public.drivers WHERE user_id = test_user_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST 1 ÉCHOUÉ - Erreur: %', SQLERRM;
    error_message := SQLERRM;
  END;
  
  -- Test avec quelques champs de plus
  IF error_message IS NULL THEN
    BEGIN
      INSERT INTO public.drivers (
        user_id,
        first_name,
        last_name,
        phone,
        status,
        created_at,
        updated_at
      ) VALUES (
        test_user_id,
        'jaw',
        'ben',
        '',
        'incomplete',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '✅ TEST 2 RÉUSSI - Insertion avec noms possible';
      
      -- Nettoyer
      DELETE FROM public.drivers WHERE user_id = test_user_id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ TEST 2 ÉCHOUÉ - Erreur: %', SQLERRM;
    END;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 DIAGNOSTIC TERMINÉ';
  RAISE NOTICE 'Regardez les contraintes CHECK ci-dessus pour identifier le problème';
  
END $$;
