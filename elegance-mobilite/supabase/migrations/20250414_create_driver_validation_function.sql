-- Fonction pour la validation des chauffeurs par les administrateurs
CREATE OR REPLACE FUNCTION validate_driver(
  driver_id UUID,
  approved BOOLEAN,
  rejection_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Vérification que l'utilisateur est admin
  IF NOT auth.role() = ANY(ARRAY['app_admin', 'app_super_admin']) THEN
    RAISE EXCEPTION 'Only administrators can validate drivers';
  END IF;

  -- Récupération de l'ID de l'utilisateur associé au chauffeur
  SELECT user_id INTO v_user_id
  FROM public.drivers
  WHERE id = driver_id AND status = 'pending_validation'::driver_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver not found or not pending validation';
  END IF;

  IF approved THEN
    -- Mise à jour du statut du chauffeur
    UPDATE public.drivers
    SET 
      status = 'active'::driver_status,
      updated_at = NOW()
    WHERE id = driver_id;

    -- Attribution du rôle de chauffeur
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"app_driver"'
    )
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Driver validated successfully',
      'status', 'active'
    );
  ELSE
    -- Rejet de la demande
    UPDATE public.drivers
    SET 
      status = 'inactive'::driver_status,
      updated_at = NOW(),
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{rejection_reason}',
        to_jsonb(COALESCE(rejection_reason, 'No reason provided'))
      )
    WHERE id = driver_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Driver application rejected',
      'status', 'inactive',
      'reason', COALESCE(rejection_reason, 'No reason provided')
    );
  END IF;

EXCEPTION WHEN others THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Autorisation d'appel de la fonction
GRANT EXECUTE ON FUNCTION validate_driver TO authenticated;
REVOKE EXECUTE ON FUNCTION validate_driver FROM anon, service_role;

COMMENT ON FUNCTION validate_driver IS 'Fonction sécurisée pour la validation ou le rejet des demandes de chauffeur par les administrateurs';

-- Trigger pour notifier le chauffeur de la validation/rejet
CREATE OR REPLACE FUNCTION notify_driver_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut change de pending_validation vers autre chose
  IF OLD.status = 'pending_validation' AND OLD.status != NEW.status THEN
    -- Insérer une notification (à implémenter selon votre système de notification)
    -- Par exemple, via une table de notifications ou un service externe
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS driver_validation_notification ON public.drivers;
CREATE TRIGGER driver_validation_notification
  AFTER UPDATE OF status ON public.drivers
  FOR EACH ROW
  WHEN (OLD.status = 'pending_validation'::driver_status)
  EXECUTE FUNCTION notify_driver_validation();