
-- 1. Si une table profiles existe ou est mentionnée mais n'est pas utilisée, la supprimer
DROP TABLE IF EXISTS public.profiles;

-- 2. S'assurer que la table users existe et contient les colonnes nécessaires
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client',  -- 'client', 'driver', 'admin', etc.
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer un trigger pour la synchronisation automatique
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (
    new.id, 
    'client',  -- Par défaut, les nouveaux utilisateurs sont des clients
    new.created_at,
    new.created_at
  )
  ON CONFLICT (id) DO NOTHING;  -- Éviter les erreurs si l'utilisateur existe déjà
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. S'assurer que le trigger est correctement configuré
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Synchroniser les utilisateurs existants qui pourraient être manquants
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
