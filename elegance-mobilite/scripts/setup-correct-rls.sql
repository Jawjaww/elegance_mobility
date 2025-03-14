-- Ce script configure des politiques RLS appropriées sans récursion infinie

BEGIN;

-- D'abord, désactiver RLS pour reconfigurer proprement
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Créer une politique de lecture simple et efficace
-- Les utilisateurs peuvent voir leur propre profil et les admins peuvent tout voir
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (
    auth.uid() = id OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Politique d'insertion (tout le monde peut s'inscrire)
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (true);

-- Politique de mise à jour (on peut modifier son propre profil)
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (auth.uid() = id OR
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Politique de suppression (admin uniquement)
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

COMMIT;
