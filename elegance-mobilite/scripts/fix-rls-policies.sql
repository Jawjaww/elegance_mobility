-- Script pour corriger les politiques RLS avec récursion infinie

BEGIN;

-- Désactiver temporairement RLS sur la table users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS user_profiles_policy ON users;
DROP POLICY IF EXISTS admin_read_users ON users;
DROP POLICY IF EXISTS admin_update_users ON users;

-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Politique simple: les utilisateurs peuvent voir leur propre profil
CREATE POLICY users_view_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Politique d'administration: les administrateurs peuvent tout voir
-- Cette politique utilise auth.jwt() qui ne cause pas de récursion
CREATE POLICY admins_view_all ON users
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 3. Politique d'insertion: tout le monde peut s'inscrire
CREATE POLICY users_insert_self ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Politique de mise à jour pour son propre profil
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- 5. Politique de mise à jour pour les admins
CREATE POLICY admins_update_all ON users
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- 6. Politique de suppression (admin uniquement)
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

COMMIT;
