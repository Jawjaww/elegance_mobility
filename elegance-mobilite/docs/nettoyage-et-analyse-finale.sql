-- NETTOYAGE ET ANALYSE FINALE
-- Script à exécuter dans l'interface Supabase SQL Editor

-- 🧹 ÉTAPE 1 : Nettoyer l'utilisateur de test
DO $$
DECLARE
  test_user_id uuid := 'dc62bd52-0ed7-495b-9055-22635d6c5e74';
BEGIN
  -- Supprimer de drivers si existe
  DELETE FROM public.drivers WHERE user_id = test_user_id;
  
  -- Supprimer de users si existe  
  DELETE FROM public.users WHERE id = test_user_id;
  
  RAISE NOTICE '✅ Utilisateur de test nettoyé : %', test_user_id;
END $$;

-- 🔍 ÉTAPE 2 : Découvrir la structure RÉELLE de la table users
SELECT 
  'STRUCTURE TABLE USERS' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 🔍 ÉTAPE 2b : Analyse détaillée des champs vehicle dans drivers
SELECT 
  'ANALYSE CHAMPS VEHICLE' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'drivers'
AND column_name LIKE '%vehicle%'
ORDER BY column_name;

-- 🔍 ÉTAPE 3 : Vérifier toutes les contraintes NOT NULL
SELECT 
  'CONTRAINTES NOT NULL CRITIQUES' as info,
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'drivers'
AND is_nullable = 'NO'
AND column_default IS NULL  -- Champs requis sans valeur par défaut
ORDER BY column_name;

-- 🔍 ÉTAPE 4 : Test d'insertion réelle pour confirmer le problème
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  error_message text;
  user_columns text;
BEGIN
  RAISE NOTICE '🧪 TEST D''INSERTION MINIMALE';
  RAISE NOTICE 'User ID test : %', test_user_id;
  
  -- Découvrir quelles colonnes existent dans public.users
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
  INTO user_columns
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'users';
  
  RAISE NOTICE 'Colonnes disponibles dans public.users: %', user_columns;
  
  -- Essayer d'insérer l'utilisateur avec seulement l'ID (minimal)
  BEGIN
    INSERT INTO public.users (id) VALUES (test_user_id);
    RAISE NOTICE '✅ Utilisateur créé dans public.users avec ID minimal';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Impossible de créer l''utilisateur: %', SQLERRM;
    RAISE NOTICE '🔧 Le trigger ne pourra pas fonctionner si public.users est requis';
    -- Continuer le test sans créer l'utilisateur
  END;
  
  -- Essayer d'insérer le driver minimal (même si user n'existe pas, pour tester les contraintes)
  BEGIN
    INSERT INTO public.drivers (
      user_id,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ SUCCESS! Driver créé avec le minimum de champs';
    RAISE NOTICE '🎯 Le trigger peut fonctionner correctement';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ÉCHEC DRIVER - Erreur exacte: %', SQLERRM;
    RAISE NOTICE '🔧 Cette erreur doit être résolue pour que le trigger fonctionne';
    error_message := SQLERRM;
  END;
  
  -- Nettoyer le test
  BEGIN
    DELETE FROM public.drivers WHERE user_id = test_user_id;
    DELETE FROM public.users WHERE id = test_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorer les erreurs de nettoyage
  END;
  
  IF error_message IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTION REQUISE:';
    RAISE NOTICE '1. Identifier le champ problématique dans l''erreur ci-dessus';
    RAISE NOTICE '2. Soit le rendre nullable, soit lui donner une valeur par défaut';
    RAISE NOTICE '3. Ou adapter le trigger pour fournir une valeur valide';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '🎉 EXCELLENT! La table est prête pour le trigger automatique';
    RAISE NOTICE 'Vous pouvez maintenant utiliser le frontend sans problème';
  END IF;
  
END $$;

-- 🔍 ÉTAPE 5 : Vérifier les contraintes CHECK qui pourraient bloquer
SELECT 
  'CONTRAINTES CHECK ACTIVES' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.drivers'::regclass 
AND contype = 'c'
ORDER BY conname;

-- 📝 RAPPORT FINAL
SELECT '
🎯 RÉSUMÉ DU DIAGNOSTIC:

1. Les contraintes FK montrent une possible duplication: 
   - current_vehicle_id (avec ON DELETE SET NULL) ✅
   - vehicle_id (sans ON DELETE SET NULL) ⚠️

2. Si vehicle_id est NOT NULL sans valeur par défaut, cela bloque l''insertion.

3. Solutions possibles:
   a) Rendre vehicle_id nullable
   b) Lui donner une valeur par défaut  
   c) Adapter le trigger pour créer un véhicule temporaire
   d) Utiliser uniquement current_vehicle_id

🚀 Après ce diagnostic, le frontend pourra créer des drivers automatiquement!
' as rapport;
