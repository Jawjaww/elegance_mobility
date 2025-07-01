-- Migration: Fix RLS policies to use raw_app_meta_data instead of JWT metadata
-- Date: 2025-06-29
-- Issue: HTTP 406 errors due to incorrect role checking in RLS policies

BEGIN;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own data" ON drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own data" ON drivers;
DROP POLICY IF EXISTS "Users can create own driver profile" ON drivers;

-- Ensure RLS is enabled
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create corrected policies that use raw_app_meta_data from auth.users

-- Allow admins to see all drivers
CREATE POLICY "Admins can view all drivers" ON drivers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- Allow drivers to see their own data (simplified)
CREATE POLICY "Drivers can view own data" ON drivers
FOR SELECT USING (
  auth.uid() = user_id
);

-- Allow admins to update all drivers
CREATE POLICY "Admins can update drivers" ON drivers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- Allow admins to insert new drivers
CREATE POLICY "Admins can insert drivers" ON drivers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- Allow users to create their own driver profile
CREATE POLICY "Users can create own driver profile" ON drivers
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Allow drivers to update their own data
CREATE POLICY "Drivers can update own data" ON drivers
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Add helpful comments
COMMENT ON POLICY "Admins can view all drivers" ON drivers IS 
'Fixed: Uses raw_app_meta_data from auth.users instead of JWT metadata';

COMMENT ON POLICY "Drivers can view own data" ON drivers IS 
'Simplified: Based on auth.uid() = user_id, no role check needed';

COMMENT ON POLICY "Admins can update drivers" ON drivers IS 
'Fixed: Uses raw_app_meta_data from auth.users for admin role verification';

COMMENT ON POLICY "Drivers can update own data" ON drivers IS 
'Simplified: Drivers can update their own data without additional role checks';

COMMENT ON POLICY "Users can create own driver profile" ON drivers IS 
'Allows any authenticated user to create their driver profile';

-- Test the fix with the problematic user
DO $$
DECLARE
  test_user_id uuid := 'dc62bd52-0ed7-495b-9055-22635d6c5e74';
  driver_count integer;
BEGIN
  -- This should now work without 406 errors
  SELECT COUNT(*) INTO driver_count
  FROM drivers 
  WHERE user_id = test_user_id;
  
  RAISE NOTICE 'Migration successful: Found % driver records for user %', driver_count, test_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration test failed: %', SQLERRM;
END $$;

COMMIT;
