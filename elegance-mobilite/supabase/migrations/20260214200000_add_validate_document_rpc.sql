-- Migration: add RPC to validate/reject driver documents and create audit log

BEGIN;

CREATE OR REPLACE FUNCTION public.validate_driver_document(p_document_id uuid, p_approve boolean, p_reason text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_doc record;
BEGIN
  -- Only admins can validate documents
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_doc FROM public.driver_documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'document not found');
  END IF;

  UPDATE public.driver_documents
  SET validation_status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      validated_by = auth.uid(),
      validated_at = now(),
      rejection_reason = CASE WHEN p_approve THEN NULL ELSE p_reason END
  WHERE id = p_document_id
  RETURNING * INTO v_doc;

  -- Insert audit log entry
  INSERT INTO public.audit_logs (event_type, service, metadata, created_at)
  VALUES (
    'driver_document_validation',
    'admin',
    jsonb_build_object(
      'document_id', p_document_id,
      'driver_id', v_doc.driver_id,
      'document_type', v_doc.document_type,
      'action', CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      'reason', p_reason,
      'validated_by', auth.uid()
    ),
    now()
  );

  RETURN jsonb_build_object('success', true, 'document', to_jsonb(v_doc));

EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

COMMIT;
