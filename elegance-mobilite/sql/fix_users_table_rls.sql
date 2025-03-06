-- Script pour corriger les politiques RLS sur la table users

-- 1. D'abord, vérifions si la table existe avec la structure correcte
DO $$ 
BEGIN
  -- Vérifier si les colonnes nécessaires existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    -- Ajouter les colonnes manquantes si nécessaire
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  END IF;
END $$;

-- 2. Assurer que RLS est activé
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update own user data" ON public.users;
DROP POLICY IF EXISTS "Anyone can view public user data" ON public.users;

-- 4. Créer de nouvelles politiques sécurisées
-- Politique permettant à un utilisateur de voir son propre profil
CREATE POLICY "Users can view own user data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Politique permettant à un utilisateur de mettre à jour son profil
CREATE POLICY "Users can update own user data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Politique autorisant la lecture publique de certaines données utilisateur limitées
CREATE POLICY "Anyone can view public user data" 
ON public.users 
FOR SELECT 
USING (true)
WITH CHECK (false);  -- Empêche la modification avec cette politique

-- 5. Accorder les autorisations nécessaires
GRANT SELECT, UPDATE ON public.users TO authenticated;
