-- Add audit_logs table with types compatible with Supabase generated types
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type text NOT NULL,
  service text NOT NULL,
  ride_id uuid REFERENCES rides(id),
  calculated_price decimal(10,2),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role and admins to view audit logs
CREATE POLICY "Service role can access audit logs"
ON audit_logs 
FOR ALL
TO authenticated
USING (
  get_user_app_role() IN ('app_admin', 'app_super_admin')
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_ride_id ON audit_logs(ride_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_audit_logs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_audit_logs_timestamp
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_logs_updated_at();

-- Add trigger to validate metadata JSON
CREATE OR REPLACE FUNCTION validate_audit_logs_metadata()
RETURNS trigger AS $$
BEGIN
  IF NEW.metadata IS NOT NULL AND jsonb_typeof(NEW.metadata) != 'object' THEN
    RAISE EXCEPTION 'metadata must be a JSON object';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_audit_logs_metadata
  BEFORE INSERT OR UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_audit_logs_metadata();

COMMENT ON TABLE audit_logs IS 'Audit logs for webhook operations';