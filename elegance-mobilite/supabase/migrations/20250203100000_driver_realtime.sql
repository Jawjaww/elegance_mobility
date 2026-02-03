-- Migration: Driver Realtime System
-- Description: Functions and tables for real-time driver tracking and ride acceptance
-- Compatible avec et sans PostGIS

-- ============================================
-- Enable PostGIS (if available)
-- ============================================
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS not available, using simple lat/lng columns';
END $$;

-- ============================================
-- Table: driver_locations (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Colonnes simples (toujours disponibles)
    lat numeric,
    lng numeric,
    -- Colonne PostGIS (si disponible)
    location geometry(POINT, 4326),
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
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add to realtime publication';
END $$;

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
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.driver_locations (
        driver_id,
        lat,
        lng,
        location,
        heading,
        speed,
        accuracy,
        is_online,
        last_updated
    )
    VALUES (
        auth.uid(),
        p_lat,
        p_lng,
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')
            THEN ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
            ELSE NULL
        END,
        p_heading,
        p_speed,
        p_accuracy,
        true,
        now()
    )
    ON CONFLICT (driver_id)
    DO UPDATE SET
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        location = CASE 
            WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')
            THEN EXCLUDED.location
            ELSE public.driver_locations.location
        END,
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
    
    -- Create notification for client (if table exists)
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
        -- Table notifications might not exist
        NULL;
    END;
    
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
        -- Distance simple (Haversine approximation)
        (6371000 * acos(
            cos(radians(p_lat)) * cos(radians(dl.lat)) * 
            cos(radians(dl.lng) - radians(p_lng)) + 
            sin(radians(p_lat)) * sin(radians(dl.lat))
        ))::numeric as distance_meters,
        dl.heading,
        dl.last_updated
    FROM public.driver_locations dl
    WHERE dl.is_online = true
      AND dl.last_updated > now() - interval '5 minutes'
      AND dl.lat IS NOT NULL
      AND dl.lng IS NOT NULL
      -- Approximate bounding box filter first (fast)
      AND dl.lat BETWEEN p_lat - (p_radius_km / 111.0) AND p_lat + (p_radius_km / 111.0)
      AND dl.lng BETWEEN p_lng - (p_radius_km / (111.0 * cos(radians(p_lat)))) AND p_lng + (p_radius_km / (111.0 * cos(radians(p_lat))))
      -- Then accurate distance
      AND (6371000 * acos(
          cos(radians(p_lat)) * cos(radians(dl.lat)) * 
          cos(radians(dl.lng) - radians(p_lng)) + 
          sin(radians(p_lat)) * sin(radians(dl.lat))
      )) <= p_radius_km * 1000
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
