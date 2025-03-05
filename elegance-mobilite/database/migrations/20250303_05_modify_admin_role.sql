DO $$ 
BEGIN
  -- Supprimer l'ancien rôle admin s'il existe
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
    DROP ROLE admin;
  END IF;

  -- Créer le nouveau rôle admin avec les permissions correctes
  CREATE ROLE admin WITH LOGIN;
  
  -- Donner les privilèges sur le schéma public
  GRANT USAGE ON SCHEMA public TO admin;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

  -- Donner des privilèges spécifiques sur le schéma auth
  GRANT USAGE ON SCHEMA auth TO admin;
  GRANT SELECT ON ALL TABLES IN SCHEMA auth TO admin;
  
  -- S'assurer que les nouvelles tables seront accessibles à admin
  ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO admin;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON SEQUENCES TO admin;

  -- Configurer les politiques pour admin
  ALTER POLICY "Enable admin access" ON public.rides
    TO admin
    USING (true)
    WITH CHECK (true);

  -- Appliquer le rôle aux utilisateurs admin existants
  FOR admin_user IN (
    SELECT email 
    FROM auth.users 
    WHERE raw_app_meta_data->>'role' = 'admin'
  ) LOOP
    EXECUTE format('GRANT admin TO %I', admin_user.email);
  END LOOP;

END $$;

-- Vérifier que le rôle est correctement créé
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    RAISE EXCEPTION 'Le rôle admin n''a pas été créé correctement';
  END IF;
END $$;
