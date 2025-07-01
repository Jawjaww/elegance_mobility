-- 🚀 CORRECTION FINALE - UTILISER LE JWT AU LIEU DE raw_app_meta_data
-- Le problème : les politiques RLS utilisent auth.users.raw_app_meta_data 
-- Mais le JWT contient app_metadata.role !

-- =================================================================
-- CORRECTION DES POLITIQUES DRIVERS
-- =================================================================

BEGIN;

-- Supprimer les politiques actuelles
DROP POLICY IF EXISTS "drivers_own_access" ON drivers;
DROP POLICY IF EXISTS "drivers_admin_access" ON drivers;

-- 🚀 NOUVELLE POLITIQUE utilisant le JWT
CREATE POLICY "drivers_own_access" ON drivers
FOR ALL USING (user_id = auth.uid());

-- Politique admin utilisant le JWT
CREATE POLICY "drivers_admin_access" ON drivers
FOR ALL USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('app_admin', 'app_super_admin')
);

COMMIT;

-- =================================================================
-- CORRECTION DES POLITIQUES RIDES
-- =================================================================

BEGIN;

-- Supprimer les politiques actuelles
DROP POLICY IF EXISTS "rides_available_for_drivers" ON rides;
DROP POLICY IF EXISTS "rides_accept_by_driver" ON rides;
DROP POLICY IF EXISTS "rides_admin_all" ON rides;

-- 🚀 POLITIQUE CRITIQUE utilisant le JWT
CREATE POLICY "rides_available_for_drivers" ON rides
FOR SELECT USING (
  driver_id IS NULL 
  AND status = 'pending'
  AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'app_driver'
);

-- Politique pour accepter les courses (UPDATE)
CREATE POLICY "rides_accept_by_driver" ON rides
FOR UPDATE USING (
  driver_id IS NULL 
  AND status = 'pending'
  AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'app_driver'
) WITH CHECK (
  driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
  AND status IN ('scheduled', 'in-progress')
);

-- Politique admin utilisant le JWT
CREATE POLICY "rides_admin_all" ON rides
FOR ALL USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('app_admin', 'app_super_admin')
);

COMMIT;

-- =================================================================
-- TEST IMMÉDIAT
-- =================================================================

-- Simple message de confirmation
DO $$
BEGIN
  RAISE NOTICE '🎯 POLITIQUES RLS MISES À JOUR!';
  RAISE NOTICE '✅ Les politiques utilisent maintenant auth.jwt() app_metadata';
  RAISE NOTICE '✅ Correspond au JWT de l''application';
  RAISE NOTICE '🚀 Actualisez Firefox - les erreurs 403 devraient disparaître!';
END $$;

-- Afficher les nouvelles politiques
SELECT 
  tablename,
  policyname,
  cmd,
  qual as "USING_clause"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('drivers', 'rides')
  AND policyname IN ('drivers_own_access', 'drivers_admin_access', 'rides_available_for_drivers', 'rides_accept_by_driver', 'rides_admin_all')
ORDER BY tablename, policyname;

-- =================================================================
-- RÉSUMÉ
-- =================================================================

/*
🚀 CORRECTION APPLIQUÉE:

❌ AVANT (ne fonctionnait pas):
   - Politiques RLS utilisaient: auth.users.raw_app_meta_data ->> 'role'
   - Mais le JWT contient: app_metadata.role

✅ APRÈS (devrait fonctionner):
   - Politiques RLS utilisent: (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'
   - Correspond exactement au JWT de l'application

🎯 DONNÉES JWT CONFIRMÉES:
   - User ID: dc62bd52-0ed7-495b-9055-22635d6c5e74
   - Role: app_driver (dans app_metadata)
   - Token valide et présent

🚀 RÉSULTAT ATTENDU:
   - Plus d'erreurs 403 sur drivers
   - Plus d'erreurs 403 sur rides
   - Les courses disponibles s'affichent

📝 ACTIONS:
   1. Actualiser Firefox (F5)
   2. Vérifier la console Network
   3. Confirmer que les erreurs 403 ont disparu
*/
