-- Fix: Add unique constraint on driver_id for driver_locations
-- This fixes the ON CONFLICT error

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS public.driver_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lat numeric,
    lng numeric,
    heading numeric,
    speed numeric,
    accuracy numeric,
    is_online boolean DEFAULT false,
    last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing constraint if it exists (to avoid errors)
DO $$
BEGIN
    ALTER TABLE public.driver_locations DROP CONSTRAINT IF EXISTS driver_locations_driver_id_key;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Add unique constraint on driver_id
ALTER TABLE public.driver_locations ADD CONSTRAINT driver_locations_driver_id_key UNIQUE (driver_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Drivers can update their own location" ON public.driver_locations;
DROP POLICY IF EXISTS "Anyone can view driver locations" ON public.driver_locations;

-- Create policies
CREATE POLICY "Drivers can update their own location"
    ON public.driver_locations
    FOR ALL
    TO authenticated
    USING (driver_id = auth.uid())
    WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Anyone can view driver locations"
    ON public.driver_locations
    FOR SELECT
    TO authenticated
    USING (true);

-- Enable realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add to realtime publication: %', SQLERRM;
END $$;

-- Grant permissions
GRANT ALL ON public.driver_locations TO authenticated;
