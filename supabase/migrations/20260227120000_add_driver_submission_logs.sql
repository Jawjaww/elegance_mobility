-- Table de logs pour tracer les soumissions de dossiers conducteurs
CREATE TABLE IF NOT EXISTS public.driver_submission_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('submission_started', 'profile_updated', 'document_uploaded', 'submission_completed', 'validation_requested', 'validation_approved', 'validation_rejected', 'status_changed')),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_driver_submission_logs_driver_id ON public.driver_submission_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_submission_logs_user_id ON public.driver_submission_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_submission_logs_created_at ON public.driver_submission_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_submission_logs_action ON public.driver_submission_logs(action);

-- Fonction de log automatique
CREATE OR REPLACE FUNCTION public.log_driver_action(
  p_driver_id UUID,
  p_user_id UUID,
  p_action VARCHAR(50),
  p_previous_status VARCHAR(50) DEFAULT NULL,
  p_new_status VARCHAR(50) DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.driver_submission_logs (
    driver_id,
    user_id,
    action,
    previous_status,
    new_status,
    details,
    error_message,
    ip_address,
    user_agent
  )
  SELECT 
    p_driver_id,
    p_user_id,
    p_action,
    p_previous_status,
    p_new_status,
    p_details,
    p_error_message,
    CAST(current_setting('request.jwt.claims', true)::json->>'ip' AS INET),
    current_setting('request.jwt.claims', true)::json->>'user_agent'::TEXT
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Fonction pour obtenir l'historique d'un conducteur
CREATE OR REPLACE FUNCTION public.get_driver_submission_history(p_driver_id UUID)
RETURNS TABLE (
  id UUID,
  action VARCHAR(50),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  formatted_date TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    dsl.id,
    dsl.action,
    dsl.previous_status,
    dsl.new_status,
    dsl.details,
    dsl.error_message,
    dsl.created_at,
    TO_CHAR(dsl.created_at, 'DD/MM/YYYY HH24:MI:SS') as formatted_date
  FROM public.driver_submission_logs dsl
  WHERE dsl.driver_id = p_driver_id
  ORDER BY dsl.created_at DESC
  LIMIT 100;
$$;

-- Trigger pour logger les changements de statut automatiquement
CREATE OR REPLACE FUNCTION public.log_driver_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ne logger que si le statut a changé
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

-- Créer le trigger sur la table drivers
DROP TRIGGER IF EXISTS trigger_log_driver_status_change ON public.drivers;
CREATE TRIGGER trigger_log_driver_status_change
  AFTER UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_driver_status_change();

-- RLS Policies
ALTER TABLE public.driver_submission_logs ENABLE ROW LEVEL SECURITY;

-- Les conducteurs peuvent voir leurs propres logs
CREATE POLICY "drivers_can_view_own_logs" ON public.driver_submission_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Les admins peuvent tout voir
CREATE POLICY "admins_can_view_all_logs" ON public.driver_submission_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    AND (company_name IS NOT NULL OR total_rides > 100)
  ));

-- Insertion uniquement via la fonction de log
CREATE POLICY "logs_insert_via_function" ON public.driver_submission_logs
  FOR INSERT TO authenticated
  WITH CHECK (false); -- Empêche l'insertion directe