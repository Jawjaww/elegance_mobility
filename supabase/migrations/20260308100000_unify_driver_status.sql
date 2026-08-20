
-- Migration: Unify driver status into single column
-- Consolidates 'status' and 'submission_status' into 'status' only
-- Enum values draft/rejected/pending_review are added in 20260308090000.

-- 1. Update status based on submission_status
UPDATE public.drivers 
SET status = CASE 
  WHEN submission_status = 'pending_review' THEN 'pending_review'::driver_status
  WHEN submission_status = 'approved' THEN 'active'::driver_status
  WHEN submission_status = 'rejected' THEN 'rejected'::driver_status
  WHEN submission_status = 'draft' AND status = 'incomplete' THEN 'draft'::driver_status
  ELSE status::driver_status
END
WHERE submission_status IS NOT NULL;

-- 3. Update remaining 'incomplete' to 'draft'
UPDATE public.drivers 
SET status = 'draft'::driver_status 
WHERE status = 'incomplete';

-- 4. Drop submission_status column (after updating data)
ALTER TABLE public.drivers DROP COLUMN IF EXISTS submitted_at;
ALTER TABLE public.drivers DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE public.drivers DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE public.drivers DROP COLUMN IF EXISTS review_notes;
ALTER TABLE public.drivers DROP COLUMN IF EXISTS submission_status;

-- 5. Update get_driver_dossier_status function
-- DROP required: previous version returned status VARCHAR(50), now TEXT
DROP FUNCTION IF EXISTS public.get_driver_dossier_status(UUID);

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
      WHEN d.status IN ('pending_review', 'active', 'rejected') THEN false
      ELSE true
    END as is_editable,
    CASE 
      WHEN d.status = 'draft' THEN true
      ELSE false
    END as can_submit,
    CASE 
      WHEN d.status = 'active' THEN false
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

GRANT EXECUTE ON FUNCTION public.get_driver_dossier_status TO authenticated;

-- 6. Update can_edit_driver_dossier function
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

  IF v_driver_status IN ('pending_review', 'active', 'rejected') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.can_edit_driver_dossier TO authenticated;

-- 7. Update submit_driver_dossier function
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

  IF v_driver_status != 'draft' THEN
    RETURN QUERY SELECT false, v_driver_status, 'Le dossier ne peut pas être soumis dans cet état';
    RETURN;
  END IF;

  UPDATE public.drivers
  SET status = 'pending_review'::driver_status, updated_at = NOW()
  WHERE id = p_driver_id;

  RETURN QUERY SELECT true, 'pending_review', 'Dossier soumis avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_driver_dossier TO authenticated;

-- 8. Update validate_driver_dossier function
CREATE OR REPLACE FUNCTION public.validate_driver_dossier(p_driver_id UUID, p_admin_user_id UUID, p_approved BOOLEAN, p_rejection_reason TEXT DEFAULT NULL)
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
    RETURN QUERY SELECT false, NULL, 'Conducteur non trouvé';
    RETURN;
  END IF;

  IF v_driver_status != 'pending_review' THEN
    RETURN QUERY SELECT false, v_driver_status, 'Le dossier nest pas en attente de validation';
    RETURN;
  END IF;

  IF p_approved THEN
    UPDATE public.drivers
    SET status = 'active'::driver_status, updated_at = NOW()
    WHERE id = p_driver_id;

    RETURN QUERY SELECT true, 'active', 'Dossier validé avec succès';
  ELSE
    UPDATE public.drivers
    SET status = 'rejected'::driver_status, updated_at = NOW()
    WHERE id = p_driver_id;

    RETURN QUERY SELECT true, 'rejected', 'Dossier rejeté';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_driver_dossier TO authenticated;

-- 9. Update the driver_submission_logs trigger function (remove references to submission_status)
CREATE OR REPLACE FUNCTION public.log_driver_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_driver_action(
      NEW.id,
      NEW.user_id,
      'status_changed',
      OLD.status::text,
      NEW.status::text,
      jsonb_build_object(
        'trigger', 'automatic',
        'table', 'drivers',
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;
