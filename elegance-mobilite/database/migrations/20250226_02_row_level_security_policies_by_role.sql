-- Function to delete a user safely
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete from auth.users (this will cascade to other tables)
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Grant execute permission to the service_role
GRANT EXECUTE ON FUNCTION delete_user TO service_role;
