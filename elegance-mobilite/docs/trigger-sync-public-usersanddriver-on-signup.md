-- 1. Fonction trigger pour synchroniser auth.users → public.users + public.drivers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  portal_type text;
BEGIN
  -- Extraire le portal_type des metadata
  portal_type := NEW.raw_user_meta_data->>'portal_type';
  
  -- Toujours créer l'utilisateur dans public.users
  INSERT INTO public.users (id, first_name, last_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.phone,
    NEW.created_at,
    NEW.updated_at
  );
  
  -- Si portal_type = 'driver', créer aussi un enregistrement dans public.drivers
  IF portal_type = 'driver' THEN
    INSERT INTO public.drivers (
      id, -- ou user_id selon votre schéma
      first_name,
      last_name,
      phone,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NEW.phone,
      'incomplete', -- Statut initial pour un profil non complété
      NEW.created_at,
      NEW.updated_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger qui s'exécute après chaque création d'utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  
  