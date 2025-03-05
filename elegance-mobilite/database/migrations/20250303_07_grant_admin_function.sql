-- Function to grant admin role
CREATE OR REPLACE FUNCTION public.grant_admin_role(admin_email TEXT)
RETURNS void AS $$
BEGIN
  -- Vérifier si l'utilisateur existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = admin_email
  ) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- S'assurer que le rôle admin existe
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
      CREATE ROLE admin WITH LOGIN;
      GRANT USAGE ON SCHEMA public TO admin;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
    END IF;
  END $$;

  -- Accorder le rôle admin
  EXECUTE format('GRANT admin TO %I', admin_email);

  -- Mettre à jour les métadonnées de l'utilisateur
  UPDATE auth.users
  SET 
    raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    ),
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{is_super_admin}',
      'true'
    )
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder l'accès à la fonction pour le service role
REVOKE ALL ON FUNCTION public.grant_admin_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role;

-- Créer une politique pour les super admins
CREATE POLICY "Super admins can do anything" ON public.rides
    TO admin
    USING (
      (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean)
    )
    WITH CHECK (
      (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean)
    );
