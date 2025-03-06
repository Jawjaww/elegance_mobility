-- Activer RLS sur la table users si ce n'est pas déjà fait
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique permettant aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Politique permettant aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Vérifier les utilisateurs qui n'ont pas d'entrée dans public.users
SELECT auth.users.id 
FROM auth.users 
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE public.users.id IS NULL;

-- Ajouter les utilisateurs manquants
INSERT INTO public.users (id, role, created_at, updated_at)
SELECT 
  auth.users.id,
  'client',
  auth.users.created_at,
  CURRENT_TIMESTAMP
FROM auth.users
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE public.users.id IS NULL;

-- Fonction pour synchroniser automatiquement les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (NEW.id, 'client', NEW.created_at, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour exécuter la fonction à chaque création d'utilisateur dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
