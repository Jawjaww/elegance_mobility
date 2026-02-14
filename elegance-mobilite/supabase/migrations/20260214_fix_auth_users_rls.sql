-- Fix: Grant authenticated users read access to auth.users for RLS policies
-- This is needed because admin policies on driver_documents query auth.users to check roles
GRANT SELECT ON auth.users TO authenticated;
