-- Align ride acceptance trigger with drivers.id on rides.driver_id
-- and stop forcing obsolete ride_status 'accepted'.

DROP FUNCTION IF EXISTS public.can_driver_accept_rides(uuid);

CREATE FUNCTION public.can_driver_accept_rides(driver_ref uuid)
RETURNS TABLE(can_accept boolean, reason text, profile_status text, validation_status text)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  driver_record record;
  completeness_result record;
  v_user_id uuid;
BEGIN
  SELECT * INTO driver_record
  FROM public.drivers
  WHERE id = driver_ref OR user_id = driver_ref
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Profil driver introuvable', 'missing', 'none';
    RETURN;
  END IF;

  v_user_id := driver_record.user_id;

  CASE driver_record.status
    WHEN 'incomplete' THEN
      RETURN QUERY SELECT
        false,
        'Profil incomplet - veuillez remplir tous les champs requis',
        'incomplete',
        'incomplete';
      RETURN;

    WHEN 'pending_validation', 'pending_review', 'draft', 'rejected' THEN
      RETURN QUERY SELECT
        false,
        'Profil en attente de validation par un administrateur',
        'complete',
        driver_record.status::text;
      RETURN;

    WHEN 'inactive' THEN
      RETURN QUERY SELECT
        false,
        'Profil désactivé - activez votre profil pour accepter des courses',
        'exists',
        'inactive';
      RETURN;

    WHEN 'suspended' THEN
      RETURN QUERY SELECT
        false,
        'Profil suspendu par un administrateur - contactez le support',
        'exists',
        'suspended';
      RETURN;

    WHEN 'on_vacation' THEN
      RETURN QUERY SELECT
        false,
        'Vous êtes en vacances - modifiez votre statut pour accepter des courses',
        'exists',
        'on_vacation';
      RETURN;

    WHEN 'active' THEN
      NULL;

    ELSE
      RETURN QUERY SELECT
        false,
        format('Statut driver non reconnu: %s', driver_record.status),
        'exists',
        driver_record.status::text;
      RETURN;
  END CASE;

  SELECT * INTO completeness_result
  FROM check_driver_profile_completeness(v_user_id);

  IF NOT completeness_result.is_complete THEN
    RETURN QUERY SELECT
      false,
      format(
        'ERREUR: Profil actif mais incomplet (%s%%). Contactez un administrateur.',
        completeness_result.completion_percentage
      ),
      'inconsistent',
      'active';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Autorisé à accepter des courses', 'complete', 'active';
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_ride_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  auth_result record;
BEGIN
  IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR OLD.driver_id IS DISTINCT FROM NEW.driver_id) THEN
    SELECT * INTO auth_result FROM can_driver_accept_rides(NEW.driver_id);

    IF NOT auth_result.can_accept THEN
      RAISE EXCEPTION 'Driver non autorisé: %', auth_result.reason;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
