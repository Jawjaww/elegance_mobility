-- 🚀 MIGRATION DATABASE FINALE - 100% COMPATIBLE
-- Ajout uniquement des champs essentiels pour l'upload de fichiers

-- =================================================================
-- ANALYSE : VOTRE SCHÉMA EXISTANT DÉJÀ PRÉSENT
-- =================================================================
-- ✅ Déjà présents dans drivers:
-- - availability_hours (Json) 
-- - avatar_url (string)
-- - preferred_zones (string[])
-- - status (driver_status enum)
-- - vehicle_type_enum: "STANDARD" | "PREMIUM" | "VAN" | "ELECTRIC"

-- =================================================================
-- ÉTAPE 1: AJOUTER UNIQUEMENT LES CHAMPS VRAIMENT MANQUANTS
-- =================================================================

-- Stockage des URLs de documents
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS document_urls JSONB DEFAULT '{}';

-- Adresse (pour validation VTC)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Contact d'urgence (sécurité)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- =================================================================
-- ÉTAPE 2: TABLE DOCUMENTS (TRACKING DÉTAILLÉ)
-- =================================================================

CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'driving_license', 'vtc_card', 'insurance', 'vehicle_registration',
    'medical_certificate', 'tax_certificate'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date DATE,
  -- Éviter conflit avec driver_status
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);

-- =================================================================
-- ÉTAPE 3: TABLE VÉHICULES AVEC VOTRE ENUM
-- =================================================================

CREATE TABLE IF NOT EXISTS driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  license_plate TEXT NOT NULL UNIQUE,
  color TEXT,
  -- UTILISER VOTRE ENUM EXISTANT
  vehicle_type vehicle_type_enum DEFAULT 'STANDARD',
  seats INTEGER DEFAULT 4,
  is_primary BOOLEAN DEFAULT false,
  photos JSONB DEFAULT '[]', -- URLs photos véhicule
  documents JSONB DEFAULT '{}', -- carte grise, assurance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver_id ON driver_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_primary ON driver_vehicles(driver_id, is_primary);

-- =================================================================
-- ÉTAPE 4: POLITIQUES RLS
-- =================================================================

-- Documents
CREATE POLICY "Drivers can manage own documents"
ON driver_documents FOR ALL TO authenticated
USING (
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all driver documents"
ON driver_documents FOR SELECT TO authenticated
USING (
  ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
);

-- Véhicules
CREATE POLICY "Drivers can manage own vehicles"
ON driver_vehicles FOR ALL TO authenticated
USING (
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all driver vehicles"
ON driver_vehicles FOR SELECT TO authenticated
USING (
  ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
);

-- =================================================================
-- ÉTAPE 5: FONCTION DE COMPLÉTUDE SIMPLIFIÉE
-- =================================================================

CREATE OR REPLACE FUNCTION check_driver_profile_completeness_simple(driver_user_id UUID)
RETURNS TABLE(
  is_complete BOOLEAN,
  completion_percentage INTEGER,
  missing_fields TEXT[]
) AS $$
DECLARE
  driver_record drivers%ROWTYPE;
  missing_list TEXT[] := '{}';
  total_fields INTEGER := 10; -- Champs vraiment essentiels
  completed_fields INTEGER := 0;
BEGIN
  SELECT * INTO driver_record FROM drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, ARRAY['Driver not found']::TEXT[];
    RETURN;
  END IF;
  
  -- Identité
  IF driver_record.first_name IS NOT NULL AND driver_record.first_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Prenom');
  END IF;
  
  IF driver_record.last_name IS NOT NULL AND driver_record.last_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom');
  END IF;
  
  IF driver_record.phone IS NOT NULL AND driver_record.phone != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Telephone');
  END IF;
  
  IF driver_record.company_name IS NOT NULL AND driver_record.company_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom entreprise');
  END IF;
  
  -- Adresse
  IF driver_record.address_line1 IS NOT NULL AND driver_record.address_line1 != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Adresse');
  END IF;
  
  -- Documents VTC
  IF driver_record.vtc_card_number IS NOT NULL AND driver_record.vtc_card_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Carte VTC');
  END IF;
  
  IF driver_record.driving_license_number IS NOT NULL AND driver_record.driving_license_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Permis de conduire');
  END IF;
  
  IF driver_record.insurance_number IS NOT NULL AND driver_record.insurance_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Assurance');
  END IF;
  
  -- Photo de profil
  IF driver_record.avatar_url IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Photo de profil');
  END IF;
  
  -- Au moins un véhicule
  IF EXISTS(SELECT 1 FROM driver_vehicles WHERE driver_id = driver_record.id) THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Vehicule');
  END IF;
  
  RETURN QUERY SELECT 
    (array_length(missing_list, 1) IS NULL OR array_length(missing_list, 1) = 0),
    (completed_fields * 100 / total_fields),
    COALESCE(missing_list, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- ÉTAPE 6: FONCTION HELPER DOCUMENTS
-- =================================================================

CREATE OR REPLACE FUNCTION update_driver_document_url(
  p_driver_id UUID,
  p_document_type TEXT,
  p_file_url TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_urls JSONB;
BEGIN
  SELECT document_urls INTO current_urls 
  FROM drivers 
  WHERE id = p_driver_id;
  
  IF current_urls IS NULL THEN
    current_urls := '{}'::JSONB;
  END IF;
  
  current_urls := current_urls || jsonb_build_object(p_document_type, p_file_url);
  
  UPDATE drivers 
  SET document_urls = current_urls 
  WHERE id = p_driver_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- ÉTAPE 7: TRIGGERS
-- =================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_driver_vehicles_updated_at 
  BEFORE UPDATE ON driver_vehicles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- MESSAGE FINAL
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE 'MIGRATION FINALE TERMINEE!';
  RAISE NOTICE 'Supprime years_experience (inutile)';
  RAISE NOTICE 'Utilise votre enum vehicle_type_enum existant';
  RAISE NOTICE 'Fonction completude simplifiee (10 champs essentiels)';
  RAISE NOTICE 'Compatible 100%% avec votre schema';
  RAISE NOTICE '';
  RAISE NOTICE 'MAPPING TYPES VEHICULES:';
  RAISE NOTICE '- STANDARD: berlines classiques';
  RAISE NOTICE '- PREMIUM: vehicules haut de gamme';
  RAISE NOTICE '- VAN: vehicules spacieux';
  RAISE NOTICE '- ELECTRIC: vehicules electriques';
  RAISE NOTICE '';
  RAISE NOTICE 'PRET POUR L''INTERFACE MODERNE!';
END $$;
