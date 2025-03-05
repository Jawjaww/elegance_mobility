-- Enable RLS on rides table
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to rides
CREATE POLICY admin_rides_policy
  ON rides
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Grant privileges to authenticated users
GRANT SELECT ON rides TO authenticated;

-- Grant additional privileges to service role
GRANT ALL ON rides TO service_role;
