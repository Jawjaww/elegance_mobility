-- 🚀 VÉRIFICATION DES PROBLÈMES SUPABASE
-- Script pour identifier et corriger les problèmes de chargement

-- =================================================================
-- ÉTAPE 1: VÉRIFIER LA CONNEXION DE BASE
-- =================================================================

-- Tester une requête simple sur la table drivers
SELECT 
  count(*) as "Nombre de drivers",
  array_agg(status) as "Statuts présents"
FROM drivers;

-- =================================================================
-- ÉTAPE 2: VÉRIFIER LA FONCTION RPC
-- =================================================================

-- Tester si la fonction RPC existe
SELECT 
  p.proname as "Nom de la fonction",
  p.prosrc as "Corps de la fonction"
FROM pg_proc p 
WHERE p.proname LIKE '%check_driver_profile%'
LIMIT 3;

-- =================================================================
-- ÉTAPE 3: TESTER LA FONCTION RPC MANUELLEMENT
-- =================================================================

-- Essayer d'appeler la fonction RPC avec un driver existant
DO $$
DECLARE
    test_user_id UUID;
    result RECORD;
BEGIN
    -- Récupérer un user_id existant
    SELECT user_id INTO test_user_id 
    FROM drivers 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Tester la fonction RPC
        SELECT * INTO result 
        FROM check_driver_profile_completeness(test_user_id);
        
        RAISE NOTICE '✅ Fonction RPC OK pour user_id: %', test_user_id;
        RAISE NOTICE 'Résultat: is_complete=%, completion_percentage=%', 
            result.is_complete, result.completion_percentage;
    ELSE
        RAISE NOTICE '⚠️ Aucun driver trouvé pour tester la RPC';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur RPC: %', SQLERRM;
END $$;

-- =================================================================
-- ÉTAPE 4: VÉRIFIER LES DONNÉES DRIVERS
-- =================================================================

-- Vérifier les drivers avec leurs données
SELECT 
  d.id,
  d.user_id,
  d.first_name,
  d.last_name,
  d.status,
  CASE 
    WHEN d.first_name IS NULL OR d.last_name IS NULL THEN 'INCOMPLET'
    WHEN d.phone IS NULL THEN 'INCOMPLET'
    WHEN d.company_name IS NULL THEN 'INCOMPLET'
    ELSE 'COMPLET'
  END as "profil_status"
FROM drivers d
ORDER BY d.created_at DESC;

-- =================================================================
-- ÉTAPE 5: CRÉER UNE FONCTION DE FALLBACK
-- =================================================================

-- Créer une fonction simple de vérification de complétude
CREATE OR REPLACE FUNCTION simple_driver_completeness_check(driver_user_id UUID)
RETURNS TABLE(
  is_complete BOOLEAN,
  completion_percentage INTEGER,
  missing_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN d.first_name IS NOT NULL 
        AND d.last_name IS NOT NULL 
        AND d.phone IS NOT NULL 
        AND d.company_name IS NOT NULL 
      THEN TRUE 
      ELSE FALSE 
    END as is_complete,
    CASE 
      WHEN d.first_name IS NOT NULL 
        AND d.last_name IS NOT NULL 
        AND d.phone IS NOT NULL 
        AND d.company_name IS NOT NULL 
      THEN 100 
      ELSE 50 
    END as completion_percentage,
    CASE 
      WHEN d.first_name IS NULL OR d.last_name IS NULL 
      THEN ARRAY['Nom complet manquant']::TEXT[]
      WHEN d.phone IS NULL 
      THEN ARRAY['Téléphone manquant']::TEXT[]
      WHEN d.company_name IS NULL 
      THEN ARRAY['Nom entreprise manquant']::TEXT[]
      ELSE ARRAY[]::TEXT[]
    END as missing_fields
  FROM drivers d
  WHERE d.user_id = driver_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- MESSAGE FINAL
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 DIAGNOSTIC SUPABASE TERMINÉ';
  RAISE NOTICE '✅ Vérifiez les résultats ci-dessus';
  RAISE NOTICE '✅ Fonction de fallback créée: simple_driver_completeness_check()';
  RAISE NOTICE '';
  RAISE NOTICE '📝 SI PROBLÈMES PERSISTENT:';
  RAISE NOTICE '1. Utilisez la fonction de fallback dans le hook';
  RAISE NOTICE '2. Vérifiez les permissions RLS';
  RAISE NOTICE '3. Vérifiez la connexion Supabase';
END $$;
