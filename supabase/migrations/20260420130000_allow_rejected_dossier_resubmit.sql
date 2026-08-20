-- Allow rejected dossiers to be edited and resubmitted (draft-like)

CREATE OR REPLACE FUNCTION public.can_edit_driver_dossier(p_driver_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_driver_user_id UUID;
  v_driver_status TEXT;
BEGIN
  SELECT d.user_id, d.status::text
  INTO v_driver_user_id, v_driver_status
  FROM public.drivers d
  WHERE d.id = p_driver_id;

  IF v_driver_user_id IS NULL OR v_driver_user_id != p_user_id THEN
    RETURN false;
  END IF;

  IF v_driver_status IN ('pending_review', 'active') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    RETURN QUERY SELECT false, v_driver_status, 'Accès non autorisé';
    RETURN;
  END IF;

  IF v_driver_status NOT IN ('draft', 'rejected', 'incomplete') THEN
    RETURN QUERY SELECT false, v_driver_status, 'Le dossier ne peut pas être soumis dans cet état';
    RETURN;
  END IF;

  UPDATE public.drivers
  SET status = 'pending_review'::driver_status, updated_at = NOW()
  WHERE id = p_driver_id;

  RETURN QUERY SELECT true, 'pending_review', 'Dossier soumis avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_driver_dossier_status(p_driver_id UUID)
RETURNS TABLE (
  status TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  is_editable BOOLEAN,
  can_submit BOOLEAN,
  can_edit_documents BOOLEAN,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(d.status::text, 'draft') as status,
    NULL::TIMESTAMP WITH TIME ZONE as submitted_at,
    NULL::TIMESTAMP WITH TIME ZONE as validated_at,
    NULL::TIMESTAMP WITH TIME ZONE as rejected_at,
    NULL::TEXT as rejection_reason,
    CASE
      WHEN d.status IN ('pending_review', 'active') THEN false
      ELSE true
    END as is_editable,
    CASE
      WHEN d.status IN ('draft', 'rejected', 'incomplete') THEN true
      ELSE false
    END as can_submit,
    CASE
      WHEN d.status = 'active' THEN false
      WHEN d.status = 'pending_review' THEN false
      ELSE true
    END as can_edit_documents,
    CASE
      WHEN d.status = 'active' THEN 100::NUMERIC
      WHEN d.status = 'pending_review' THEN 90::NUMERIC
      WHEN d.status = 'rejected' THEN 50::NUMERIC
      ELSE 10::NUMERIC
    END as completion_percentage
  FROM public.drivers d
  WHERE d.id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
