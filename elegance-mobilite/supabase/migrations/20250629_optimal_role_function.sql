-- 🎯 ARCHITECTURE FINALE OPTIMISÉE - Fonction get_user_app_role() Hybride
-- Combine performance JWT + fiabilité Database

BEGIN;

-- 1. 🔧 FONCTION OPTIMISÉE get_user_app_role()
-- Version hybride : JWT first (fast), DB fallback (reliable)
DROP FUNCTION IF EXISTS public.get_user_app_role();

CREATE OR REPLACE FUNCTION public.get_user_app_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- 🚀 Première tentative : JWT (performance)
  BEGIN
    SELECT COALESCE(
      (auth.jwt() ->> 'raw_app_meta_data')::jsonb ->> 'role',
      NULL
    ) INTO user_role;
  EXCEPTION WHEN OTHERS THEN
    user_role := NULL;
  END;
  
  -- 🛡️ Fallback : Requête DB (fiabilité)
  IF user_role IS NULL OR user_role = '' THEN
    SELECT COALESCE(
      (SELECT raw_app_meta_data ->> 'role' FROM auth.users WHERE id = auth.uid()),
      'anonymous'
    ) INTO user_role;
  END IF;
  
  RETURN COALESCE(user_role, 'anonymous');
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_user_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_app_role() TO anon;

-- 2. 🧹 STANDARDISER LES POLITIQUES RLS
-- Maintenant qu'on a une fonction fiable, on peut l'utiliser partout

-- Drivers: Remplacer les politiques incohérentes
DROP POLICY IF EXISTS "Drivers can view their own profile" ON drivers;
CREATE POLICY "Drivers can view their own profile"
ON drivers FOR SELECT USING (
  user_id = auth.uid() AND get_user_app_role() = 'app_driver'
);

-- Rides: Utiliser la fonction dans toutes les politiques chauffeur  
DROP POLICY IF EXISTS "Drivers can accept available rides" ON rides;
CREATE POLICY "Drivers can accept available rides"
ON rides FOR UPDATE USING (
  driver_id IS NULL 
  AND status = 'pending'
  AND get_user_app_role() = 'app_driver'
) WITH CHECK (
  driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
  AND status IN ('scheduled', 'in-progress')
  AND get_user_app_role() = 'app_driver'
);

-- 3. 📊 TEST DE LA FONCTION
SELECT 
  '🧪 FUNCTION TEST' as test,
  get_user_app_role() as function_result,
  auth.uid() as current_user,
  CASE 
    WHEN get_user_app_role() = 'app_driver' THEN '✅ FONCTION MARCHE'
    WHEN get_user_app_role() = 'anonymous' THEN '⚠️ UTILISATEUR NON CONNECTÉ'
    ELSE '📋 RÔLE: ' || get_user_app_role()
  END as function_status;

COMMIT;

-- 🎯 AVANTAGES DE CETTE APPROCHE:
-- ✅ Performance: JWT en priorité (pas de requête DB)
-- ✅ Fiabilité: DB en fallback si JWT échoue
-- ✅ Cohérence: Une seule fonction dans tout le système
-- ✅ Maintenabilité: Logique centralisée
-- ✅ Lisibilité: get_user_app_role() = 'app_driver' est clair

-- 📋 UTILISATION RECOMMANDÉE:
-- Dans les politiques RLS: get_user_app_role() = 'ROLE_NAME'
-- Dans les fonctions: IF get_user_app_role() = 'app_admin' THEN ...
-- Dans l'application: SELECT get_user_app_role() pour vérifier le rôle
