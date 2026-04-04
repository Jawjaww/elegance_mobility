-- Fonctions RPC pour la gestion des états de dossier

-- Fonction pour obtenir l'état actuel du dossier d'un conducteur
CREATE OR REPLACE FUNCTION public.get_driver_dossier_status(p_driver_id UUID)
RETURNS TABLE (
  status VARCHAR(50),
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
    COALESCE(d.status, 'draft') as status,
    d.submitted_at,
    d.validated_at,
    d.rejected_at,
    d.rejection_reason,
    CASE 
      WHEN d.status IN ('submitted', 'validated', 'rejected') THEN false
      ELSE true
    END as is_editable,
    CASE 
      WHEN d.status = 'draft' OR d.status IS NULL THEN true
      ELSE false
    END as can_submit,
    CASE 
      WHEN d.status = 'validated' THEN false
      ELSE true
    END as can_edit_documents,
    COALESCE(d.completion_percentage, 0) as completion_percentage
  FROM public.drivers d
  WHERE d.id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les permissions d'édition
CREATE OR REPLACE FUNCTION public.can_edit_driver_dossier(p_driver_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_driver_user_id UUID;
  v_status VARCHAR(50);
BEGIN
  -- Récupérer l'user_id associé au conducteur et son statut
  SELECT d.user_id, COALESCE(d.status, 'draft')
  INTO v_driver_user_id, v_status
  FROM public.drivers d
  WHERE d.id = p_driver_id;

  -- Vérifier que le conducteur appartient à l'utilisateur
  IF v_driver_user_id IS NULL OR v_driver_user_id != p_user_id THEN
    RETURN false;
  END IF;

  -- Vérifier que le dossier n'est pas verrouillé
  IF v_status IN ('submitted', 'validated', 'rejected') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour soumettre un dossier
CREATE OR REPLACE FUNCTION public.submit_driver_dossier(p_driver_id UUID, p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  new_status VARCHAR(50),
  message TEXT
) AS $$
DECLARE
  v_driver_user_id UUID;
  v_current_status VARCHAR(50);
  v_completion_percentage NUMERIC;
BEGIN
  -- Récupérer les informations actuelles
  SELECT d.user_id, COALESCE(d.status, 'draft'), COALESCE(d.completion_percentage, 0)
  INTO v_driver_user_id, v_current_status, v_completion_percentage
  FROM public.drivers d
  WHERE d.id = p_driver_id;

  -- Vérifier que le conducteur appartient à l'utilisateur
  IF v_driver_user_id IS NULL OR v_driver_user_id != p_user_id THEN
    RETURN QUERY SELECT false, v_current_status, 'Accès non autorisé';
    RETURN;
  END IF;

  -- Vérifier que le dossier n'est pas déjà soumis
  IF v_current_status != 'draft' THEN
    RETURN QUERY SELECT false, v_current_status, 'Le dossier ne peut pas être soumis dans cet état';
    RETURN;
  END IF;

  -- Vérifier que le dossier est complet (100%)
  IF v_completion_percentage < 100 THEN
    RETURN QUERY SELECT false, v_current_status, 'Le dossier doit être complet à 100% pour être soumis';
    RETURN;
  END IF;

  -- Mettre à jour le statut et la date de soumission
  UPDATE public.drivers
  SET 
    status = 'submitted',
    submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_driver_id;

  -- Enregistrer l'action dans les logs
  INSERT INTO public.driver_submission_logs (
    driver_id,
    user_id,
    action,
    previous_status,
    new_status,
    details
  ) VALUES (
    p_driver_id,
    p_user_id,
    'submission_completed',
    'draft',
    'submitted',
    jsonb_build_object(
      'completion_percentage', v_completion_percentage,
      'submission_time', NOW()
    )
  );

  RETURN QUERY SELECT true, 'submitted', 'Dossier soumis avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider un dossier (admin only)
CREATE OR REPLACE FUNCTION public.validate_driver_dossier(p_driver_id UUID, p_admin_user_id UUID, p_approved BOOLEAN, p_rejection_reason TEXT DEFAULT NULL)
RETURNS TABLE (
  success BOOLEAN,
  new_status VARCHAR(50),
  message TEXT
) AS $$
DECLARE
  v_current_status VARCHAR(50);
  v_driver_user_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est un admin (vous pouvez ajouter une vérification de rôle ici)
  -- Pour l'instant, nous supposons que seul un admin peut appeler cette fonction

  -- Récupérer le statut actuel et l'user_id du conducteur
  SELECT d.status, d.user_id
  INTO v_current_status, v_driver_user_id
  FROM public.drivers d
  WHERE d.id = p_driver_id;

  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT false, NULL, 'Conducteur non trouvé';
    RETURN;
  END IF;

  -- Vérifier que le dossier est en attente de validation
  IF v_current_status != 'submitted' THEN
    RETURN QUERY SELECT false, v_current_status, 'Le dossier n''est pas en attente de validation';
    RETURN;
  END IF;

  -- Mettre à jour le statut
  IF p_approved THEN
    UPDATE public.drivers
    SET 
      status = 'validated',
      validated_at = NOW(),
      updated_at = NOW()
    WHERE id = p_driver_id;

    -- Enregistrer l'action dans les logs
    INSERT INTO public.driver_submission_logs (
      driver_id,
      user_id,
      action,
      previous_status,
      new_status,
      details
    ) VALUES (
      p_driver_id,
      v_driver_user_id,
      'validation_approved',
      'submitted',
      'validated',
      jsonb_build_object('validated_by', p_admin_user_id, 'validation_time', NOW())
    );

    RETURN QUERY SELECT true, 'validated', 'Dossier validé avec succès';
  ELSE
    UPDATE public.drivers
    SET 
      status = 'rejected',
      rejected_at = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
    WHERE id = p_driver_id;

    -- Enregistrer l'action dans les logs
    INSERT INTO public.driver_submission_logs (
      driver_id,
      user_id,
      action,
      previous_status,
      new_status,
      details
    ) VALUES (
      p_driver_id,
      v_driver_user_id,
      'validation_rejected',
      'submitted',
      'rejected',
      jsonb_build_object(
        'rejected_by', p_admin_user_id,
        'rejection_time', NOW(),
        'rejection_reason', p_rejection_reason
      )
    );

    RETURN QUERY SELECT true, 'rejected', 'Dossier rejeté';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_driver_dossier_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_driver_dossier TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_driver_dossier TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_driver_dossier TO authenticated;