-- Create admin role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Grant privileges to admin role
GRANT authenticated TO admin;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(auth.jwt() ->> 'role', '') = 'admin'
$$;

-- Function to set user role as admin
CREATE OR REPLACE FUNCTION auth.set_user_role_admin(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET role = 'admin'
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION auth.set_user_role_admin TO service_role;
