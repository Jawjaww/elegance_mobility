-- Enable RLS on drivers and vehicles tables
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to drivers
CREATE POLICY admin_drivers_policy
  ON drivers
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Create policy for admin access to vehicles
CREATE POLICY admin_vehicles_policy
  ON vehicles
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Grant privileges to authenticated users
GRANT SELECT ON drivers TO authenticated;
GRANT SELECT ON vehicles TO authenticated;

-- Grant additional privileges to service role
GRANT ALL ON drivers TO service_role;
GRANT ALL ON vehicles TO service_role;
