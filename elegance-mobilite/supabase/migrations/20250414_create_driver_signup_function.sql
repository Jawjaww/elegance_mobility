-- Fonction sécurisée pour l'inscription des chauffeurs
CREATE OR REPLACE FUNCTION create_pending_driver(
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_vtc_card_number TEXT,
  p_driving_license_number TEXT,
  p_vtc_card_expiry_date DATE,
  p_driving_license_expiry_date DATE,
  p_insurance_number TEXT DEFAULT NULL,
  p_insurance_expiry_date DATE DEFAULT NULL,
  p_languages_spoken TEXT[] DEFAULT NULL,
  p_preferred_zones TEXT[] DEFAULT NULL,
  p_company_name TEXT DEFAULT '',
  p_company_phone TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  -- Vérification que l'utilisateur est connecté
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Vérification que l'utilisateur n'est pas déjà un chauffeur
  IF EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User is already registered as a driver';
  END IF;

  -- Vérification des dates d'expiration
  IF p_vtc_card_expiry_date <= CURRENT_DATE OR
     p_driving_license_expiry_date <= CURRENT_DATE OR
     (p_insurance_expiry_date IS NOT NULL AND p_insurance_expiry_date <= CURRENT_DATE) THEN
    RAISE EXCEPTION 'Invalid expiry dates';
  END IF;

  -- Insertion dans la table drivers
  INSERT INTO public.drivers (
    user_id,
    first_name,
    last_name,
    phone,
    vtc_card_number,
    driving_license_number,
    vtc_card_expiry_date,
    driving_license_expiry_date,
    insurance_number,
    insurance_expiry_date,
    languages_spoken,
    preferred_zones,
    company_name,
    company_phone,
    status,
    total_rides
  ) VALUES (
    auth.uid(),
    p_first_name,
    p_last_name,
    p_phone,
    p_vtc_card_number,
    p_driving_license_number,
    p_vtc_card_expiry_date,
    p_driving_license_expiry_date,
    p_insurance_number,
    p_insurance_expiry_date,
    p_languages_spoken,
    p_preferred_zones,
    p_company_name,
    p_company_phone,
    'pending_validation',
    0
  ) RETURNING id INTO v_driver_id;

  -- Mise à jour des métadonnées utilisateur
  UPDATE auth.users 
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{portal_type}',
    '"driver"'
  )
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'success', true,
    'driver_id', v_driver_id,
    'message', 'Driver registration pending validation'
  );

EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Autorisation d'appel de la fonction
GRANT EXECUTE ON FUNCTION create_pending_driver TO authenticated;
REVOKE EXECUTE ON FUNCTION create_pending_driver FROM anon, service_role;

COMMENT ON FUNCTION create_pending_driver IS 'Fonction sécurisée pour l''inscription des chauffeurs avec statut pending_validation';