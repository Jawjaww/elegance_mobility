-- Migration: ajouter champs compliance pour drivers et driver_documents
-- Non destructive: ajout de colonnes et extension du check constraint

BEGIN;

-- Ajout colonnes à public.drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS driving_license_issue_date date,
  ADD COLUMN IF NOT EXISTS driving_license_categories text[],
  ADD COLUMN IF NOT EXISTS company_siret text,
  ADD COLUMN IF NOT EXISTS payment_provider_account_id text,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Étendre driver_documents: ajouter validated_by / validated_at et nouveaux types
ALTER TABLE public.driver_documents
  ADD COLUMN IF NOT EXISTS validated_by uuid,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Remplacer la contrainte driver_documents_document_type_check pour inclure plus de types
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'driver_documents' AND c.conname = 'driver_documents_document_type_check'
  ) THEN
    ALTER TABLE public.driver_documents DROP CONSTRAINT driver_documents_document_type_check;
  END IF;
  ALTER TABLE public.driver_documents ADD CONSTRAINT driver_documents_document_type_check CHECK (
    document_type = ANY (ARRAY[
      'driving_license'::text,
      'vtc_card'::text,
      'insurance'::text,
      'vehicle_registration'::text,
      'medical_certificate'::text,
      'tax_certificate'::text,
      'id_card'::text,
      'passport'::text,
      'proof_of_address'::text,
      'bank_document'::text,
      'training_certificate'::text,
      'rental_contract'::text
    ])
  );
END$$;

-- Mettre à jour la fonction check_driver_profile_completeness pour prendre en compte id_card et proof_of_address
-- On ajoute une version conservatrice: si les colonnes/documents existent, on les exige dans la complétude
CREATE OR REPLACE FUNCTION public.check_driver_profile_completeness(driver_user_id uuid)
 RETURNS TABLE(is_complete boolean, completion_percentage integer, missing_fields text[])
 LANGUAGE plpgsql
AS $function$
DECLARE
  driver_record drivers%ROWTYPE;
  missing_list TEXT[] := '{}';
  checks_total INTEGER := 0;
  completed_fields INTEGER := 0;
  has_plate boolean := false;
BEGIN
  SELECT * INTO driver_record FROM drivers WHERE user_id = driver_user_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, ARRAY['Driver not found']::TEXT[];
    RETURN;
  END IF;

  -- IDENTITÉ
  checks_total := checks_total + 1;
  IF driver_record.first_name IS NOT NULL AND driver_record.first_name <> '' AND driver_record.first_name <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Prénom');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.last_name IS NOT NULL AND driver_record.last_name <> '' AND driver_record.last_name <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.phone IS NOT NULL AND driver_record.phone <> '' AND driver_record.phone <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Téléphone');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.date_of_birth IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Date de naissance');
  END IF;

  -- ADRESSE
  checks_total := checks_total + 1;
  IF driver_record.address_line1 IS NOT NULL AND driver_record.address_line1 <> '' AND driver_record.address_line1 <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Adresse');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.city IS NOT NULL AND driver_record.city <> '' AND driver_record.city <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Ville');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.postal_code IS NOT NULL AND driver_record.postal_code <> '' AND driver_record.postal_code <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Code postal');
  END IF;

  -- NUMÉROS DE DOCUMENTS
  checks_total := checks_total + 1;
  IF driver_record.vtc_card_number IS NOT NULL AND driver_record.vtc_card_number <> '' AND driver_record.vtc_card_number <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro carte VTC');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.driving_license_number IS NOT NULL AND driver_record.driving_license_number <> '' AND driver_record.driving_license_number <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro permis');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.insurance_number IS NOT NULL AND driver_record.insurance_number <> '' AND driver_record.insurance_number <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro assurance');
  END IF;

  -- PHOTO DE PROFIL
  checks_total := checks_total + 1;
  IF driver_record.avatar_url IS NOT NULL AND driver_record.avatar_url <> '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Photo de profil');
  END IF;

  -- DOCUMENTS (driver_documents) - now also require id_card and proof_of_address
  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'driving_license' AND validation_status = 'approved') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document permis (approuvé)');
  END IF;

  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'vtc_card' AND validation_status = 'approved') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document carte VTC (approuvé)');
  END IF;

  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'insurance' AND validation_status = 'approved') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document assurance (approuvé)');
  END IF;

  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type IN ('id_card','passport') AND validation_status = 'approved') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Pièce d''identité (approuvée)');
  END IF;

  checks_total := checks_total + 1;
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'proof_of_address' AND validation_status = 'approved') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Justificatif de domicile (approuvé)');
  END IF;

  -- EMERGENCY CONTACT
  checks_total := checks_total + 1;
  IF driver_record.emergency_contact_name IS NOT NULL AND driver_record.emergency_contact_name <> '' AND driver_record.emergency_contact_name <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Contact d''urgence (nom)');
  END IF;

  checks_total := checks_total + 1;
  IF driver_record.emergency_contact_phone IS NOT NULL AND driver_record.emergency_contact_phone <> '' AND driver_record.emergency_contact_phone <> 'À compléter' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Contact d''urgence (téléphone)');
  END IF;

  -- VEHICLE : plaque
  checks_total := checks_total + 1;
  SELECT EXISTS(
    SELECT 1 FROM vehicles v
    WHERE v.driver_id = driver_record.id
      AND v.license_plate IS NOT NULL
      AND v.license_plate <> ''
      AND v.license_plate <> 'À compléter'
    LIMIT 1
  ) INTO has_plate;

  IF has_plate THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Plaque d''immatriculation (véhicule actif)');
  END IF;

  IF checks_total = 0 THEN
    RETURN QUERY SELECT false, 0, COALESCE(missing_list, '{}');
    RETURN;
  END IF;

  RETURN QUERY SELECT
    (array_length(missing_list,1) IS NULL OR array_length(missing_list,1) = 0),
    (completed_fields * 100 / checks_total),
    COALESCE(missing_list, '{}');
END;
$function$;

COMMIT;
