-- Migration: Unify vehicle model
-- Drop small existing `vehicles` table if exists, then rename `driver_vehicles` -> `vehicles`
-- Add missing VTC/owner fields and create `vehicle_documents` for normalized documents

BEGIN;

-- If an old lightweight `vehicles` table exists, drop it (no production data expected)
DROP TABLE IF EXISTS public.vehicles CASCADE;

-- Rename driver_vehicles to vehicles
ALTER TABLE IF EXISTS public.driver_vehicles RENAME TO vehicles;

-- Add new columns needed for VTC / ownership / validation
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS owner_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS owner_name text NULL,
  ADD COLUMN IF NOT EXISTS registration_number text NULL,
  ADD COLUMN IF NOT EXISTS vin text NULL,
  ADD COLUMN IF NOT EXISTS fuel_type text NULL,
  ADD COLUMN IF NOT EXISTS first_registration_date date NULL,
  ADD COLUMN IF NOT EXISTS insurance_number text NULL,
  ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_by uuid NULL,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NULL;

-- Ensure usual timestamps exist
ALTER TABLE public.vehicles
  ALTER COLUMN created_at SET DEFAULT now();

-- Add indexes for frequent lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_user_id ON public.vehicles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON public.vehicles(license_plate);

-- Create a normalized table for vehicle documents (photos, carte grise, etc.)
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NULL,
  file_size bigint NULL,
  upload_date timestamptz DEFAULT now(),
  validation_status text DEFAULT 'pending',
  rejection_reason text NULL,
  uploaded_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON public.vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_type ON public.vehicle_documents(document_type);

-- If previous JSON documents exist in vehicles.documents, try to migrate them (best-effort)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'documents'
  ) THEN
    WITH js AS (
      SELECT id, documents FROM public.vehicles WHERE documents IS NOT NULL
    )
    INSERT INTO public.vehicle_documents(vehicle_id, document_type, file_url, file_name, file_size)
    SELECT js.id, doc.key, (doc.value->> 'file_url')::text, (doc.value->> 'file_name')::text, (doc.value->> 'file_size')::bigint
    FROM js, jsonb_each(js.documents::jsonb) AS doc(key, value);
  END IF;
END$$;

COMMIT;

-- Notes:
-- - This migration assumes you are out of production and can drop the small pre-existing `vehicles` table.
-- - If you prefer to preserve the small `vehicles` table, modify the migration to merge rows instead of dropping.
-- - After applying, update RLS policies to allow drivers to insert/submit and admins to validate.
