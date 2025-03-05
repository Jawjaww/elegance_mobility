-- Create admin role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Grant necessary privileges to admin role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Update auth.users table to link with admin role
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_app_meta_data->>'role' = 'admin' THEN
    EXECUTE format('GRANT admin TO %I', NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- Apply role to existing admin users
DO $$
BEGIN
  EXECUTE (
    SELECT string_agg(
      format('GRANT admin TO %I', email),
      '; '
    )
    FROM auth.users
    WHERE raw_app_meta_data->>'role' = 'admin'
  );
END
$$;
