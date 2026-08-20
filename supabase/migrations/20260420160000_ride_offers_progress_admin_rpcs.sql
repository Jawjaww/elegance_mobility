-- POC ride matching: ride_offers, enriched accept_ride, status history trigger,
-- update_ride_progress, admin_cancel_ride, admin_reassign_ride, driver_offer_stats

-- ---------------------------------------------------------------------------
-- 1. ride_offers
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.ride_offer_status AS ENUM (
    'offered',
    'accepted',
    'declined',
    'timeout',
    'expired_taken'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.ride_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status public.ride_offer_status NOT NULL DEFAULT 'offered',
  offered_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ride_offers_ride_driver_unique UNIQUE (ride_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_id ON public.ride_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride_id ON public.ride_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_status ON public.ride_offers(status);

ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ride_offers_driver_select ON public.ride_offers;
CREATE POLICY ride_offers_driver_select ON public.ride_offers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = ride_offers.driver_id AND d.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS ride_offers_admin_all ON public.ride_offers;
CREATE POLICY ride_offers_admin_all ON public.ride_offers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._current_driver_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT d.id
  FROM public.drivers d
  WHERE d.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public._ride_offer_snapshot(p_ride public.rides)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'vehicle_type', p_ride.vehicle_type,
    'estimated_price', p_ride.estimated_price,
    'distance', p_ride.distance,
    'duration', p_ride.duration,
    'pickup_address', left(COALESCE(p_ride.pickup_address, ''), 120),
    'dropoff_address', left(COALESCE(p_ride.dropoff_address, ''), 120),
    'pickup_lat', p_ride.pickup_lat,
    'pickup_lon', p_ride.pickup_lon
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. record_ride_offer / respond_ride_offer
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_ride_offer(p_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id uuid := public._current_driver_id();
  v_ride public.rides%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil chauffeur introuvable');
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course non trouvée');
  END IF;
  IF v_ride.status IS DISTINCT FROM 'pending'::public.ride_status THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course non disponible');
  END IF;

  INSERT INTO public.ride_offers (ride_id, driver_id, status, offered_at, snapshot)
  VALUES (p_ride_id, v_driver_id, 'offered', now(), public._ride_offer_snapshot(v_ride))
  ON CONFLICT (ride_id, driver_id) DO UPDATE
    SET
      snapshot = EXCLUDED.snapshot,
      updated_at = now(),
      status = CASE
        WHEN public.ride_offers.status IN ('accepted', 'declined', 'timeout', 'expired_taken')
          THEN public.ride_offers.status
        ELSE 'offered'
      END;

  RETURN jsonb_build_object('success', true, 'ride_id', p_ride_id, 'driver_id', v_driver_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_ride_offer(p_ride_id uuid, p_response text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id uuid := public._current_driver_id();
  v_status public.ride_offer_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil chauffeur introuvable');
  END IF;
  IF p_response NOT IN ('declined', 'timeout') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Réponse invalide');
  END IF;

  v_status := p_response::public.ride_offer_status;

  INSERT INTO public.ride_offers (ride_id, driver_id, status, offered_at, responded_at, snapshot)
  SELECT
    r.id,
    v_driver_id,
    v_status,
    now(),
    now(),
    public._ride_offer_snapshot(r)
  FROM public.rides r
  WHERE r.id = p_ride_id
  ON CONFLICT (ride_id, driver_id) DO UPDATE
    SET
      status = EXCLUDED.status,
      responded_at = now(),
      updated_at = now()
    WHERE public.ride_offers.status = 'offered';

  RETURN jsonb_build_object(
    'success', true,
    'ride_id', p_ride_id,
    'driver_id', v_driver_id,
    'status', p_response
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ride_offer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_ride_offer(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. accept_ride: vehicle + offer bookkeeping
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
  v_ride public.rides%ROWTYPE;
  v_driver public.drivers%ROWTYPE;
  v_auth_uid uuid := auth.uid();
  v_accepted_at timestamptz := now();
  v_vehicle_id uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT * INTO v_driver
  FROM public.drivers d
  WHERE d.user_id = v_auth_uid
    AND d.status = 'active'::public.driver_status
  LIMIT 1;

  IF v_driver.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chauffeur non trouvé ou inactif');
  END IF;

  IF p_driver_id IS NOT NULL
     AND p_driver_id IS DISTINCT FROM v_driver.id
     AND p_driver_id IS DISTINCT FROM v_auth_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Identifiant chauffeur invalide');
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
  IF NOT FOUND THEN
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

  v_vehicle_id := v_driver.current_vehicle_id;

  UPDATE public.rides
  SET
    driver_id = v_driver.id,
    override_vehicle_id = COALESCE(v_vehicle_id, override_vehicle_id),
    status = 'scheduled'::public.ride_status,
    accepted_at = v_accepted_at,
    updated_at = now()
  WHERE id = p_ride_id;

  INSERT INTO public.ride_offers (ride_id, driver_id, status, offered_at, responded_at, snapshot)
  VALUES (
    p_ride_id,
    v_driver.id,
    'accepted',
    now(),
    now(),
    public._ride_offer_snapshot(v_ride)
  )
  ON CONFLICT (ride_id, driver_id) DO UPDATE
    SET status = 'accepted', responded_at = now(), updated_at = now();

  UPDATE public.ride_offers
  SET status = 'expired_taken', responded_at = COALESCE(responded_at, now()), updated_at = now()
  WHERE ride_id = p_ride_id
    AND driver_id IS DISTINCT FROM v_driver.id
    AND status = 'offered';

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
        'driver_id', v_driver.id,
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
    'driver_id', v_driver.id,
    'override_vehicle_id', v_vehicle_id,
    'status', 'scheduled',
    'accepted_at', v_accepted_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_ride(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. ride_status_history trigger + RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_ride_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ride_status_history (
      ride_id, status, previous_status, changed_by, changed_at
    ) VALUES (
      NEW.id,
      NEW.status::text,
      OLD.status::text,
      auth.uid(),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_ride_status_change ON public.rides;
CREATE TRIGGER trg_log_ride_status_change
  AFTER UPDATE OF status ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ride_status_change();

DROP POLICY IF EXISTS ride_status_history_select ON public.ride_status_history;
CREATE POLICY ride_status_history_select ON public.ride_status_history
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_status_history.ride_id
        AND (
          r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = r.driver_id AND d.user_id = auth.uid()
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 6. update_ride_progress (driver trip lifecycle)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_ride_progress(
  p_ride_id uuid,
  p_status public.ride_status
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id uuid := public._current_driver_id();
  v_ride public.rides%ROWTYPE;
  v_allowed boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil chauffeur introuvable');
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course non trouvée');
  END IF;
  IF v_ride.driver_id IS DISTINCT FROM v_driver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course non assignée à ce chauffeur');
  END IF;

  IF v_ride.status = 'scheduled'::public.ride_status AND p_status = 'in-progress'::public.ride_status THEN
    v_allowed := true;
  ELSIF v_ride.status = 'in-progress'::public.ride_status
    AND p_status IN (
      'completed'::public.ride_status,
      'driver-canceled'::public.ride_status,
      'no-show'::public.ride_status
    ) THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transition de statut non autorisée',
      'from', v_ride.status,
      'to', p_status
    );
  END IF;

  UPDATE public.rides
  SET status = p_status, updated_at = now()
  WHERE id = p_ride_id;

  RETURN jsonb_build_object(
    'success', true,
    'ride_id', p_ride_id,
    'status', p_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ride_progress(uuid, public.ride_status) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Admin cancel / reassign
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_cancel_ride(p_ride_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ride public.rides%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès admin requis');
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course non trouvée');
  END IF;

  IF v_ride.status IN (
    'completed'::public.ride_status,
    'client-canceled'::public.ride_status,
    'driver-canceled'::public.ride_status,
    'admin-canceled'::public.ride_status
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Course déjà terminée ou annulée',
      'current_status', v_ride.status
    );
  END IF;

  IF v_ride.status NOT IN (
    'pending'::public.ride_status,
    'scheduled'::public.ride_status,
    'in-progress'::public.ride_status,
    'delayed'::public.ride_status,
    'no-show'::public.ride_status
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Statut non annulable');
  END IF;

  UPDATE public.rides
  SET
    status = 'admin-canceled'::public.ride_status,
    updated_at = now(),
    pickup_notes = CASE
      WHEN p_reason IS NULL OR length(trim(p_reason)) = 0 THEN pickup_notes
      ELSE COALESCE(pickup_notes || E'\n', '') || '[admin-cancel] ' || left(p_reason, 200)
    END
  WHERE id = p_ride_id;

  RETURN jsonb_build_object('success', true, 'ride_id', p_ride_id, 'status', 'admin-canceled');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reassign_ride(
  p_ride_id uuid,
  p_driver_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ride public.rides%ROWTYPE;
  v_driver public.drivers%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Accès admin requis');
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course non trouvée');
  END IF;

  IF v_ride.status NOT IN (
    'pending'::public.ride_status,
    'scheduled'::public.ride_status
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Réaffectation seulement pour pending ou scheduled',
      'current_status', v_ride.status
    );
  END IF;

  SELECT * INTO v_driver FROM public.drivers WHERE id = p_driver_id;
  IF NOT FOUND OR v_driver.status IS DISTINCT FROM 'active'::public.driver_status THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chauffeur cible invalide ou inactif');
  END IF;

  UPDATE public.rides
  SET
    driver_id = v_driver.id,
    override_vehicle_id = COALESCE(v_driver.current_vehicle_id, override_vehicle_id),
    status = 'scheduled'::public.ride_status,
    accepted_at = COALESCE(accepted_at, now()),
    updated_at = now()
  WHERE id = p_ride_id;

  INSERT INTO public.ride_offers (ride_id, driver_id, status, offered_at, responded_at, snapshot)
  VALUES (
    p_ride_id,
    v_driver.id,
    'accepted',
    now(),
    now(),
    public._ride_offer_snapshot(v_ride)
  )
  ON CONFLICT (ride_id, driver_id) DO UPDATE
    SET status = 'accepted', responded_at = now(), updated_at = now();

  UPDATE public.ride_offers
  SET status = 'expired_taken', responded_at = COALESCE(responded_at, now()), updated_at = now()
  WHERE ride_id = p_ride_id
    AND driver_id IS DISTINCT FROM v_driver.id
    AND status = 'offered';

  RETURN jsonb_build_object(
    'success', true,
    'ride_id', p_ride_id,
    'driver_id', v_driver.id,
    'override_vehicle_id', v_driver.current_vehicle_id,
    'status', 'scheduled'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_cancel_ride(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reassign_ride(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Stats view
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.driver_offer_stats AS
SELECT
  driver_id,
  COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
  COUNT(*) FILTER (WHERE status = 'declined') AS declined_count,
  COUNT(*) FILTER (WHERE status = 'timeout') AS timeout_count,
  COUNT(*) FILTER (WHERE status = 'expired_taken') AS expired_taken_count,
  COUNT(*) FILTER (WHERE status = 'offered') AS open_offered_count,
  COUNT(*) FILTER (
    WHERE status IN ('accepted', 'declined', 'timeout', 'expired_taken')
  ) AS responded_count,
  CASE
    WHEN COUNT(*) FILTER (WHERE status IN ('accepted', 'declined', 'timeout')) = 0 THEN NULL
    ELSE ROUND(
      100.0 * COUNT(*) FILTER (WHERE status = 'accepted')
        / NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'declined', 'timeout')), 0),
      2
    )
  END AS accept_rate_pct
FROM public.ride_offers
GROUP BY driver_id;

GRANT SELECT ON public.driver_offer_stats TO authenticated;
