-- Script pour corriger la récursion infinie dans les politiques RLS de la table users

-- 1. Désactiver temporairement RLS sur la table users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes qui pourraient causer la récursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can edit all users" ON public.users;

-- 3. Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Ajouter une politique de base qui permet à l'utilisateur de voir son propre profil
-- Cette politique utilise auth.uid() directement sans requête récursive
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- 5. Permettre à l'utilisateur de mettre à jour son propre profil
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Politique pour l'insertion (généralement gérée par trigger, mais ajoutée par sécurité)
CREATE POLICY "Service can insert new users"
ON public.users
FOR INSERT
WITH CHECK (true);

-- 7. Politiques pour les administrateurs (en supposant que vous avez un champ role)
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 8. Politique pour permettre aux administrateurs de mettre à jour n'importe quel utilisateur
CREATE POLICY "Admins can edit all users" 
ON public.users 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users AS admin
    WHERE admin.id = auth.uid() AND admin.role = 'admin'
  )
);

-- 9. Accorder les privilèges d'utilisation aux rôles appropriés
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.users TO anon, authenticated;
