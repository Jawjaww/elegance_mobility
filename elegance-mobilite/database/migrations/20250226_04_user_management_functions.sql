-- Function to get user by email
CREATE OR REPLACE FUNCTION get_user_by_email(p_email TEXT)
RETURNS TABLE (
  id uuid,
  email text,
  role text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, raw_user_meta_data->>'role' as role
  FROM auth.users
  WHERE email = p_email;
$$;

-- Function to delete user by id
CREATE OR REPLACE FUNCTION delete_user_by_id(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete admin record if exists
  DELETE FROM public.admins WHERE id = p_user_id;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Grant execute permissions to service_role
GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION delete_user_by_id(UUID) TO service_role;

-- Grant access to auth schema for service_role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT, DELETE ON auth.users TO service_role;
