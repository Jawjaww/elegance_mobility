-- 🎯 ARCHITECTURE PURE - Correction Finale des Erreurs 403
-- Le problème n'est PAS les politiques RLS mais les requêtes API incorrectes !

BEGIN;

-- 🔍 DIAGNOSTIC: Vérifier que l'entrée driver existe déjà
DO $$
DECLARE
  driver_exists boolean;
  driver_record record;
BEGIN
  -- Vérifier si l'entrée driver existe
  SELECT EXISTS (
    SELECT 1 FROM drivers WHERE user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74'
  ) INTO driver_exists;
  
  IF driver_exists THEN
    RAISE NOTICE '✅ Driver entry already exists for user dc62bd52...';
    
    -- Afficher les détails
    SELECT * INTO driver_record 
    FROM drivers 
    WHERE user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';
    
    RAISE NOTICE 'Driver ID: %, User ID: %, Status: %', 
      driver_record.id, driver_record.user_id, driver_record.status;
    
    RAISE NOTICE '🚨 PROBLÈME IDENTIFIÉ: Les requêtes API utilisent drivers.id au lieu de drivers.user_id';
    RAISE NOTICE '❌ API actuelle: GET /drivers?id=eq.dc62bd52...';
    RAISE NOTICE '✅ API correcte: GET /drivers?user_id=eq.dc62bd52...';
    
  ELSE
    RAISE NOTICE '❌ Driver entry missing - this should not happen according to user';
    RAISE NOTICE 'Creating driver entry as fallback...';
    
    INSERT INTO drivers (user_id, status) 
    VALUES ('dc62bd52-0ed7-495b-9055-22635d6c5e74', 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 🎯 RECOMMANDATIONS POUR CORRECTION CÔTÉ CLIENT:
-- 
-- 1. Dans les hooks/queries React, remplacer:
--    ❌ supabase.from('drivers').select('*').eq('id', userId)
--    ✅ supabase.from('drivers').select('*').eq('user_id', userId)
--
-- 2. Pour les courses du chauffeur, remplacer:
--    ❌ supabase.from('rides').select('*').eq('driver_id', userId)  
--    ✅ supabase.from('rides').select('*').eq('driver_id', (SELECT id FROM drivers WHERE user_id = userId))
--
-- 3. Alternative: Créer une vue qui simplifie les requêtes

-- 🔧 SOLUTION TEMPORAIRE: Créer une vue pour simplifier l'accès
CREATE OR REPLACE VIEW driver_profiles AS
SELECT 
  d.*,
  au.email,
  au.raw_app_meta_data ->> 'role' as user_role,
  au.raw_user_meta_data ->> 'first_name' as meta_first_name,
  au.raw_user_meta_data ->> 'last_name' as meta_last_name
FROM drivers d
JOIN auth.users au ON d.user_id = au.id;

-- Politique RLS pour la vue
DROP POLICY IF EXISTS "Users can view their driver profile" ON driver_profiles;
CREATE POLICY "Users can view their driver profile"
ON driver_profiles FOR SELECT
USING (user_id = auth.uid());

COMMIT;

-- 📋 RÉSUMÉ DU PROBLÈME RÉEL:
-- ❌ Les requêtes API cherchent drivers.id = user_id (incorrect)
-- ✅ drivers.id est un UUID auto-généré différent de user_id
-- ✅ La bonne requête: drivers.user_id = user_id
-- 
-- SOLUTION: Corriger les requêtes côté client React/TypeScript