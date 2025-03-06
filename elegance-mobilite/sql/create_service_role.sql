-- Ce script crée un rôle de service qui peut contourner RLS pour synchroniser les utilisateurs

-- 1. Créer une fonction qui peut être exécutée avec les privilèges du propriétaire
CREATE OR REPLACE FUNCTION public.sync_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Permet d'exécuter avec les privilèges du créateur de la fonction
AS $$
BEGIN
  -- Insérer les utilisateurs manquants
  INSERT INTO public.users (id, role, created_at, updated_at)
  SELECT 
    au.id, 
    'client', 
    au.created_at,
    CURRENT_TIMESTAMP
  FROM 
    auth.users au
  LEFT JOIN 
    public.users pu ON au.id = pu.id
  WHERE 
    pu.id IS NULL;
END;
$$;

-- 2. Créer un trigger pour appeler cette fonction automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (NEW.id, 'client', NEW.created_at, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
