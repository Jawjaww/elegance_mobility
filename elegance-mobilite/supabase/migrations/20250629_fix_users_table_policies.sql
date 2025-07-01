-- 🔧 CORRECTION DES POLITIQUES RLS SUR LA TABLE USERS
-- Si la table users a des politiques restrictives, cette migration les corrige

BEGIN;

-- Vérifier l'état actuel de RLS sur users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'RLS is enabled on public.users table';
  ELSE
    RAISE NOTICE 'RLS is not enabled on public.users table';
  END IF;
END $$;

-- Si RLS est activé, ajouter des politiques appropriées
-- Permettre aux utilisateurs de voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users FOR SELECT 
USING (auth.uid() = id);

-- Permettre aux utilisateurs de modifier leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permettre la création de profils utilisateur
DROP POLICY IF EXISTS "Users can create own profile" ON users;
CREATE POLICY "Users can create own profile"
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Permettre aux admins de voir tous les utilisateurs
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
ON users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- Permettre aux admins de modifier tous les utilisateurs
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

COMMIT;

-- Test d'accès à la table users après correction
SELECT 
  'Users Access Test' as test,
  COUNT(*) as accessible_records
FROM users
WHERE id = auth.uid();

-- 🎯 Cette migration corrige les politiques sur public.users
-- pour permettre aux fonctions et aux utilisateurs d'accéder à leurs données
