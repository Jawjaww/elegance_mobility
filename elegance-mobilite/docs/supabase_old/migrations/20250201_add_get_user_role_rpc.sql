-- Migration: Ajout de la fonction RPC get_user_role
-- Date: 2025-02-01
-- Objectif: Permettre au client de récupérer son rôle applicatif via RPC

-- Fonction pour récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role'),
    (auth.jwt() -> 'app_metadata' ->> 'role')
  );
$$;

-- Commentaire
COMMENT ON FUNCTION public.get_user_role() IS 
'Retourne le rôle applicatif (app_customer, app_driver, app_admin, app_super_admin) 
de l''utilisateur connecté depuis son JWT.
À utiliser préférentiellement par le client pour connaître son rôle.';

-- Vérification
SELECT 
  'Fonction get_user_role créée' as status,
  public.get_user_role() as current_role;
