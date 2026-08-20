-- Fix accept_ride + rides.accepted_at + consolidate driver_locations
-- Aligns runtime behavior with public schema / generated database.types.ts

-- ---------------------------------------------------------------------------
-- 1. rides.accepted_at (written by accept_ride, missing from schema)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. accept_ride: resolve drivers.id, use ride_status 'scheduled', user_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_ride(
  p_ride_id uuid,
  p_driver_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ride record;
  v_driver_id uuid;
  v_auth_uid uuid := auth.uid();
  v_accepted_at timestamptz := now();
BEGIN
  IF v_auth_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  -- Resolve drivers.id from auth user; accept either drivers.id or auth.uid() as hint
  SELECT d.id INTO v_driver_id
  FROM public.drivers d
  WHERE d.user_id = v_auth_uid
    AND d.status = 'active'::public.driver_status
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Chauffeur non trouvé ou inactif'
    );
  END IF;

  IF p_driver_id IS NOT NULL
     AND p_driver_id IS DISTINCT FROM v_driver_id
     AND p_driver_id IS DISTINCT FROM v_auth_uid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Identifiant chauffeur invalide'
    );
  END IF;

  SELECT * INTO v_ride
  FROM public.rides
  WHERE id = p_ride_id
  FOR UPDATE;

  IF v_ride IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course non trouvée');
  END IF;

  IF v_ride.status IS DISTINCT FROM 'pending'::public.ride_status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cette course a déjà été acceptée ou annulée',
      'current_status', v_ride.status,
      'current_driver_id', v_ride.driver_id
    );
  END IF;

  UPDATE public.rides
  SET
    driver_id = v_driver_id,
    status = 'scheduled'::public.ride_status,
    accepted_at = v_accepted_at,
    updated_at = now()
  WHERE id = p_ride_id;

  BEGIN
    INSERT INTO public.notifications (
      user_id, type, title, message, data, read
    ) VALUES (
      v_ride.user_id,
      'ride_accepted',
      'Chauffeur assigné',
      'Un chauffeur a accepté votre course',
      jsonb_build_object(
        'ride_id', p_ride_id,
        'driver_id', v_driver_id,
        'pickup_address', v_ride.pickup_address,
        'dropoff_address', v_ride.dropoff_address
      ),
      false
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'ride_id', p_ride_id,
    'driver_id', v_driver_id,
    'status', 'scheduled',
    'accepted_at', v_accepted_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_ride(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_ride(uuid, uuid) IS
  'Driver accepts a pending ride; resolves drivers.id from auth.uid(); sets status scheduled';

-- ---------------------------------------------------------------------------
-- 3. driver_locations: lon canonical; sync via RPC (avoid bulk UPDATE on realtime)
-- ---------------------------------------------------------------------------
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;

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
DECLARE
  v_driver_id uuid;
BEGIN
  SELECT d.id INTO v_driver_id
  FROM public.drivers d
  WHERE d.user_id = auth.uid()
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Driver profile not found for current user';
  END IF;

  INSERT INTO public.driver_locations (
    driver_id, lat, lon, lng, heading, speed, accuracy,
    is_online, recorded_at, last_updated
  )
  VALUES (
    v_driver_id, p_lat, p_lng, p_lng, p_heading, p_speed, p_accuracy,
    true, now(), now()
  )
  ON CONFLICT (driver_id)
  DO UPDATE SET
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    lng = EXCLUDED.lng,
    heading = EXCLUDED.heading,
    speed = EXCLUDED.speed,
    accuracy = EXCLUDED.accuracy,
    is_online = true,
    recorded_at = now(),
    last_updated = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_driver_location TO authenticated;

-- RLS: own row via drivers.user_id = auth.uid() (driver_id is drivers.id, not auth.uid)
DROP POLICY IF EXISTS "Drivers can update their own location" ON public.driver_locations;
CREATE POLICY "Drivers can update their own location"
  ON public.driver_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_locations.driver_id
        AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_locations.driver_id
        AND d.user_id = auth.uid()
    )
  );
