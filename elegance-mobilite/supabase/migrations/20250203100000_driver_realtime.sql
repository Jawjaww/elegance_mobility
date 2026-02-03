-- Migration: Driver Realtime System
-- Description: Functions and tables for real-time driver tracking and ride acceptance

-- ============================================
-- Table: driver_locations (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location geography(POINT, 4326) NOT NULL,
    heading numeric,
    speed numeric,
    accuracy numeric,
    is_online boolean DEFAULT false,
    last_updated timestamptz DEFAULT now(),
    UNIQUE(driver_id)
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- ============================================
-- Function: update_driver_location
-- ============================================
CREATE OR REPLACE FUNCTION public.update_driver_location(
    p_lat numeric,
    p_lng numeric,
    p_heading numeric DEFAULT NULL,
    p_speed numeric DEFAULT NULL,
    p_accuracy numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    INSERT INTO public.driver_locations (
        driver_id,
        location,
        heading,
        speed,
        accuracy,
        is_online,
        last_updated
    )
    VALUES (
        auth.uid(),
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_heading,
        p_speed,
        p_accuracy,
        true,
        now()
    )
    ON CONFLICT (driver_id)
    DO UPDATE SET
        location = EXCLUDED.location,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        accuracy = EXCLUDED.accuracy,
        is_online = true,
        last_updated = now();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_driver_location TO authenticated;

-- ============================================
-- Function: accept_ride
-- ============================================
CREATE OR REPLACE FUNCTION public.accept_ride(
    p_ride_id uuid,
    p_driver_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ride record;
    v_result jsonb;
BEGIN
    -- Lock the ride row for update
    SELECT * INTO v_ride
    FROM public.rides
    WHERE id = p_ride_id
    FOR UPDATE;
    
    -- Check if ride exists
    IF v_ride IS NULL THEN
        RAISE EXCEPTION 'Course introuvable';
    END IF;
    
    -- Check if ride is still pending
    IF v_ride.status != 'pending' THEN
        RAISE EXCEPTION 'Cette course a déjà été prise';
    END IF;
    
    -- Verify driver role
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = p_driver_id 
        AND raw_app_meta_data->>'role' = 'app_driver'
    ) THEN
        RAISE EXCEPTION 'Vous devez être chauffeur pour accepter une course';
    END IF;
    
    -- Update ride with driver
    UPDATE public.rides
    SET 
        driver_id = p_driver_id,
        status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    WHERE id = p_ride_id;
    
    -- Create notification for client
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
    )
    SELECT 
        v_ride.client_id,
        'ride_accepted',
        'Chauffeur trouvé !',
        'Votre chauffeur est en route',
        jsonb_build_object(
            'ride_id', p_ride_id,
            'driver_id', p_driver_id
        );
    
    -- Return ride info
    SELECT jsonb_build_object(
        'id', r.id,
        'status', r.status,
        'driver_id', r.driver_id,
        'pickup_address', r.pickup_address,
        'dropoff_address', r.dropoff_address,
        'price', r.price
    )
    INTO v_result
    FROM public.rides r
    WHERE r.id = p_ride_id;
    
    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.accept_ride TO authenticated;

-- ============================================
-- Function: find_nearby_drivers
-- For clients to find available drivers
-- ============================================
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(
    p_lat numeric,
    p_lng numeric,
    p_radius_km numeric DEFAULT 10
)
RETURNS TABLE (
    driver_id uuid,
    distance_meters numeric,
    heading numeric,
    last_updated timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        dl.driver_id,
        ST_Distance(dl.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::numeric as distance_meters,
        dl.heading,
        dl.last_updated
    FROM public.driver_locations dl
    WHERE dl.is_online = true
      AND dl.last_updated > now() - interval '5 minutes'
      AND ST_DWithin(
          dl.location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_km * 1000
      )
    ORDER BY distance_meters;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.find_nearby_drivers TO authenticated;

-- ============================================
-- Function: set_driver_offline
-- ============================================
CREATE OR REPLACE FUNCTION public.set_driver_offline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.driver_locations
    SET is_online = false,
        last_updated = now()
    WHERE driver_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_driver_offline TO authenticated;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.driver_locations IS 'Real-time driver locations for GPS tracking';
COMMENT ON FUNCTION public.update_driver_location IS 'Update driver GPS location and set online status';
COMMENT ON FUNCTION public.accept_ride IS 'Driver accepts a pending ride request';
COMMENT ON FUNCTION public.find_nearby_drivers IS 'Find online drivers within radius';
