-- Migration: Fonction pour accepter une course (driver)
-- Créée le: 2025-02-02

-- Fonction RPC pour qu'un chauffeur accepte une course
-- Vérifie que la course est toujours en 'pending' pour éviter les race conditions
CREATE OR REPLACE FUNCTION accept_ride(
  p_ride_id UUID,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride RECORD;
  v_result JSONB;
BEGIN
  -- Vérifier que le chauffeur existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM drivers 
    WHERE id = p_driver_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Chauffeur non trouvé ou inactif'
    );
  END IF;

  -- Verrouiller la ligne et récupérer la course
  SELECT * INTO v_ride
  FROM rides
  WHERE id = p_ride_id
  FOR UPDATE;

  -- Vérifier que la course existe
  IF v_ride IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Course non trouvée'
    );
  END IF;

  -- Vérifier que la course est toujours en attente
  IF v_ride.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cette course a déjà été acceptée ou annulée',
      'current_status', v_ride.status,
      'current_driver_id', v_ride.driver_id
    );
  END IF;

  -- Mettre à jour la course
  UPDATE rides
  SET 
    driver_id = p_driver_id,
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_ride_id;

  -- Créer une notification pour le client
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
  ) VALUES (
    v_ride.client_id,
    'ride_accepted',
    'Chauffeur assigné',
    'Un chauffeur a accepté votre course',
    jsonb_build_object(
      'ride_id', p_ride_id,
      'driver_id', p_driver_id,
      'pickup_location', v_ride.pickup_location,
      'dropoff_location', v_ride.dropoff_location
    ),
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'ride_id', p_ride_id,
    'driver_id', p_driver_id,
    'status', 'accepted',
    'accepted_at', NOW()
  );
END;
$$;

-- Politique RLS pour la fonction
-- Note: La fonction utilise SECURITY DEFINER, donc elle s'exécute avec les droits du propriétaire

-- Index pour optimiser les requêtes de courses en attente
CREATE INDEX IF NOT EXISTS idx_rides_pending 
  ON rides(status, created_at) 
  WHERE status = 'pending';

COMMENT ON FUNCTION accept_ride IS 'Permet à un chauffeur d''accepter une course en attente avec vérification de race condition';
