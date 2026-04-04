-- Migration: Fix RLS policies for vehicles table
-- Date: 2026-02-08
-- Description: Add missing SELECT policies for vehicles table to fix 403 errors

-- Enable RLS on vehicles table (if not already enabled)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "vehicles_select_all" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_select_authenticated" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_select_public" ON public.vehicles;

-- Policy 1: Allow admins to see all vehicles
CREATE POLICY "vehicles_select_admin"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  is_admin()
);

-- Policy 2: Allow drivers to see their own vehicles
CREATE POLICY "vehicles_select_driver_own"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  is_driver() AND (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  )
);

-- Policy 3: Allow customers to see all vehicles (for booking purposes)
CREATE POLICY "vehicles_select_customer"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  is_customer()
);

-- Grant SELECT permission on vehicles to authenticated users
GRANT SELECT ON public.vehicles TO authenticated;

-- Comment on policies
COMMENT ON POLICY "vehicles_select_admin" ON public.vehicles IS 
'Allow admins to view all vehicles';

COMMENT ON POLICY "vehicles_select_driver_own" ON public.vehicles IS 
'Allow drivers to view their own vehicles';

COMMENT ON POLICY "vehicles_select_customer" ON public.vehicles IS 
'Allow customers to view all vehicles for booking purposes';
