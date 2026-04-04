-- Migration: Correction des permissions pour la table public.users
-- Issue: Les chauffeurs ne peuvent pas mettre à jour leur profil car les politiques RLS sur drivers
--        font référence à auth.users ou public.users sans les permissions adéquates.
--        De plus, l'accès à public.users est restreint.

BEGIN;

-- 1. S'assurer que RLS est activé sur public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;

-- 3. Créer de nouvelles politiques permissives mais sécurisées

-- Politique: Chaque utilisateur peut VOIR son propre profil public.users
CREATE POLICY "users_view_own_profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Politique: Chaque utilisateur peut MODIFIER son propre profil public.users
CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Politique: Les admins peuvent TOUT voir sur public.users
CREATE POLICY "admins_view_all_users" ON public.users
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Politique: Les admins peuvent TOUT modifier sur public.users
CREATE POLICY "admins_update_all_users" ON public.users
    FOR UPDATE
    TO authenticated
    USING (is_admin());

-- 4. Accorder les droits SELECT/UPDATE de base à authenticated
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- 5. S'assurer que les drivers peuvent être mis à jour
-- Vérification que la table drivers a les bonnes politiques
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;

-- Politique: Un chauffeur peut voir son propre profil driver
CREATE POLICY "drivers_view_own_profile" ON public.drivers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Politique: Un chauffeur peut mettre à jour son propre profil driver
CREATE POLICY "drivers_update_own_profile" ON public.drivers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politique: Un chauffeur peut insérer son propre profil (lors du signup)
CREATE POLICY "drivers_insert_own_profile" ON public.drivers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

COMMIT;
