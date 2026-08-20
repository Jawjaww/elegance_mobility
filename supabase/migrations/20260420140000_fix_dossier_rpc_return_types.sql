-- Fix RETURN QUERY type mismatch: varchar(50) vs text literals
CREATE OR REPLACE FUNCTION public.submit_driver_dossier(p_driver_id UUID, p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  new_status VARCHAR(50),
  message TEXT
) AS $$
DECLARE
  v_driver_user_id UUID;
  v_driver_status TEXT;
BEGIN
  SELECT d.user_id, d.status::text
  INTO v_driver_user_id, v_driver_status
  FROM public.drivers d
  WHERE d.id = p_driver_id;

  IF v_driver_user_id IS NULL OR v_driver_user_id != p_user_id THEN
    RETURN QUERY SELECT false, v_driver_status::varchar(50), 'Accès non autorisé'::text;
    RETURN;
  END IF;

  IF v_driver_status NOT IN ('draft', 'rejected', 'incomplete') THEN
    RETURN QUERY SELECT false, v_driver_status::varchar(50), 'Le dossier ne peut pas être soumis dans cet état'::text;
    RETURN;
  END IF;

  UPDATE public.drivers
  SET status = 'pending_review'::driver_status, updated_at = NOW()
  WHERE id = p_driver_id;

  RETURN QUERY SELECT true, 'pending_review'::varchar(50), 'Dossier soumis avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.validate_driver_dossier(
  p_driver_id UUID,
  p_admin_user_id UUID,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_status VARCHAR(50),
  message TEXT
) AS $$
DECLARE
  v_driver_status TEXT;
BEGIN
  SELECT d.status::text
  INTO v_driver_status
  FROM public.drivers d
  WHERE d.id = p_driver_id;

  IF v_driver_status IS NULL THEN
    RETURN QUERY SELECT false, NULL::varchar(50), 'Conducteur non trouvé'::text;
    RETURN;
  END IF;

  IF v_driver_status != 'pending_review' THEN
    RETURN QUERY SELECT false, v_driver_status::varchar(50), 'Le dossier nest pas en attente de validation'::text;
    RETURN;
  END IF;

  IF p_approved THEN
    UPDATE public.drivers
    SET status = 'active'::driver_status, updated_at = NOW()
    WHERE id = p_driver_id;

    RETURN QUERY SELECT true, 'active'::varchar(50), 'Dossier validé avec succès'::text;
  ELSE
    UPDATE public.drivers
    SET status = 'rejected'::driver_status, updated_at = NOW()
    WHERE id = p_driver_id;

    RETURN QUERY SELECT true, 'rejected'::varchar(50), 'Dossier rejeté'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
