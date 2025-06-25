-- MIGRATION RESPECTUEUSE DE LA STRUCTURE EXISTANTE
-- Script à exécuter dans l'interface Supabase SQL Editor
-- Spécialement conçu pour respecter les contraintes existantes

-- 🔍 ÉTAPE 1 : Vérifier l'utilisateur spécifique
SELECT 
  'UTILISATEUR ACTUEL' as info,
  au.id,
  au.email,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  au.raw_user_meta_data->>'portal_type' as portal_type,
  au.created_at
FROM auth.users au
WHERE au.id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';

-- 🔍 ÉTAPE 2 : Vérifier si les profils existent déjà
SELECT 
  'PROFILS EXISTANTS' as info,
  'public.users' as table_name,
  COUNT(*) as count
FROM public.users 
WHERE id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74'

UNION ALL

SELECT 
  'PROFILS EXISTANTS' as info,
  'public.drivers' as table_name,
  COUNT(*) as count
FROM public.drivers 
WHERE user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';

-- 🔧 ÉTAPE 3 : Créer public.users si nécessaire
INSERT INTO public.users (
  id,
  first_name,
  last_name,
  phone,
  created_at,
  updated_at
)
SELECT 
  'dc62bd52-0ed7-495b-9055-22635d6c5e74',
  'jaw',
  'ben',
  '',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74'
);

-- 🔧 ÉTAPE 4 : Création progressive du profil drivers
-- On commence par le minimum et on ajoute progressivement les champs
DO $$
DECLARE
  target_user_id uuid := 'dc62bd52-0ed7-495b-9055-22635d6c5e74';
BEGIN
  -- Vérifier si le profil existe déjà
  IF EXISTS (SELECT 1 FROM public.drivers WHERE user_id = target_user_id) THEN
    RAISE NOTICE 'ℹ️ Le profil driver existe déjà pour cet utilisateur';
    RETURN;
  END IF;
  
  -- Tentative 1: Insertion ultra-minimaliste
  BEGIN
    INSERT INTO public.drivers (user_id) VALUES (target_user_id);
    RAISE NOTICE '✅ SUCCESS: Profil driver créé (ultra-minimal)';
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Échec insertion ultra-minimale: %', SQLERRM;
  END;
  
  -- Tentative 2: Avec status
  BEGIN
    INSERT INTO public.drivers (user_id, status) 
    VALUES (target_user_id, 'incomplete');
    RAISE NOTICE '✅ SUCCESS: Profil driver créé (avec status)';
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Échec insertion avec status: %', SQLERRM;
  END;
  
  -- Tentative 3: Avec champs de base (sans dates)
  BEGIN
    INSERT INTO public.drivers (
      user_id,
      first_name,
      last_name,
      phone,
      status
    ) VALUES (
      target_user_id,
      'jaw',
      'ben',
      '',
      'incomplete'
    );
    RAISE NOTICE '✅ SUCCESS: Profil driver créé (avec infos de base)';
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Échec insertion avec infos de base: %', SQLERRM;
  END;
  
  -- Tentative 4: Avec timestamps
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
      target_user_id,
      'jaw',
      'ben',
      '',
      'incomplete',
      NOW(),
      NOW()
    );
    RAISE NOTICE '✅ SUCCESS: Profil driver créé (complet sans dates contraintes)';
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Échec insertion complète: %', SQLERRM;
  END;
  
  -- Si toutes les tentatives échouent
  RAISE NOTICE '';
  RAISE NOTICE '🚫 TOUTES LES TENTATIVES ONT ÉCHOUÉ';
  RAISE NOTICE '💡 La table drivers a des contraintes strictes qui empêchent la création automatique';
  RAISE NOTICE '🔧 Solutions possibles:';
  RAISE NOTICE '   1. Utiliser l''interface de configuration du profil';
  RAISE NOTICE '   2. Examiner les contraintes CHECK avec le script diagnostic';
  RAISE NOTICE '   3. Créer le profil manuellement avec toutes les données requises';
  
END $$;

-- 🔍 ÉTAPE 5 : Vérification finale
SELECT 
  'RÉSULTAT FINAL' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74') THEN 'EXISTE'
    ELSE 'MANQUANT'
  END as public_users_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.drivers WHERE user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74') THEN 'EXISTE'
    ELSE 'MANQUANT'
  END as public_drivers_status;

-- 🎯 ÉTAPE 6 : Recommandations finales
DO $$
DECLARE
  users_exists boolean;
  drivers_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74') INTO users_exists;
  SELECT EXISTS(SELECT 1 FROM public.drivers WHERE user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74') INTO drivers_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 ÉTAT FINAL:';
  RAISE NOTICE '  public.users: %', CASE WHEN users_exists THEN '✅ EXISTE' ELSE '❌ MANQUANT' END;
  RAISE NOTICE '  public.drivers: %', CASE WHEN drivers_exists THEN '✅ EXISTE' ELSE '❌ MANQUANT' END;
  
  IF users_exists AND drivers_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SUCCÈS COMPLET!';
    RAISE NOTICE '✅ L''utilisateur peut maintenant se connecter au dashboard';
    RAISE NOTICE '📝 Il pourra compléter son profil via l''interface';
  ELSIF users_exists AND NOT drivers_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ SUCCÈS PARTIEL';
    RAISE NOTICE '✅ public.users créé mais public.drivers bloqué par les contraintes';
    RAISE NOTICE '💡 L''utilisateur verra le message "Profil conducteur manquant"';
    RAISE NOTICE '🔧 Il pourra créer son profil via le bouton "Configurer mon profil"';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '❌ ÉCHEC - Problème plus profond à investiguer';
  END IF;
  RAISE NOTICE '';
END $$;
