-- 🚀 MIGRATION DATABASE POUR FICHIERS
-- Ajout des champs pour stockage des URLs Supabase Storage

-- =================================================================
-- ÉTAPE 1: AJOUTER LES COLONNES POUR FICHIERS
-- =================================================================

-- Colonnes pour avatar et documents
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS document_urls JSONB DEFAULT '{}';

-- Colonnes pour informations étendues
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'France';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Disponibilités et préférences
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS availability_hours JSONB DEFAULT '{}';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS preferred_work_zones TEXT[];
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS max_distance_km INTEGER DEFAULT 50;

-- =================================================================
-- ÉTAPE 2: CRÉER TABLE POUR VÉHICULES
-- =================================================================

CREATE TABLE IF NOT EXISTS driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  license_plate TEXT NOT NULL,
  color TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'luxury', 'electric')),
  seats INTEGER DEFAULT 4,
  is_primary BOOLEAN DEFAULT false,
  photos JSONB DEFAULT '[]', -- URLs des photos du véhicule
  documents JSONB DEFAULT '{}', -- carte grise, assurance véhicule
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver_id ON driver_vehicles(driver_id);

-- =================================================================
-- ÉTAPE 3: CRÉER TABLE POUR DOCUMENTS
-- =================================================================

CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'driving_license', 'vtc_card', 'insurance', 'vehicle_registration', 
    'medical_certificate', 'criminal_record', 'tax_certificate'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);

-- =================================================================
-- ÉTAPE 4: STRUCTURE JSON POUR DOCUMENTS URLS
-- =================================================================

-- Exemple de structure pour document_urls dans drivers:
/*
{
  "driving_license": "https://xxx.supabase.co/storage/v1/object/drivers/license_xxx.pdf",
  "vtc_card": "https://xxx.supabase.co/storage/v1/object/drivers/vtc_xxx.pdf",
  "insurance": "https://xxx.supabase.co/storage/v1/object/drivers/insurance_xxx.pdf"
}
*/

-- Exemple de structure pour availability_hours:
/*
{
  "monday": {"start": "08:00", "end": "20:00", "available": true},
  "tuesday": {"start": "08:00", "end": "20:00", "available": true},
  "wednesday": {"start": "08:00", "end": "20:00", "available": true},
  "thursday": {"start": "08:00", "end": "20:00", "available": true},
  "friday": {"start": "08:00", "end": "22:00", "available": true},
  "saturday": {"start": "10:00", "end": "22:00", "available": true},
  "sunday": {"start": "10:00", "end": "18:00", "available": false}
}
*/

-- =================================================================
-- ÉTAPE 5: POLITIQUES RLS POUR NOUVELLES TABLES
-- =================================================================

-- Politiques pour driver_vehicles
CREATE POLICY "Drivers can manage own vehicles"
ON driver_vehicles FOR ALL TO authenticated
USING (
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all vehicles"
ON driver_vehicles FOR SELECT TO authenticated
USING (
  ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
);

-- Politiques pour driver_documents
CREATE POLICY "Drivers can manage own documents"
ON driver_documents FOR ALL TO authenticated
USING (
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all documents"
ON driver_documents FOR SELECT TO authenticated
USING (
  ((auth.jwt() -> 'app_metadata'::text)::jsonb ->> 'role'::text) = ANY(ARRAY['app_admin', 'app_super_admin'])
);

-- =================================================================
-- ÉTAPE 6: FONCTIONS HELPER
-- =================================================================

-- Fonction pour calculer la complétude avec nouveaux champs
CREATE OR REPLACE FUNCTION enhanced_check_driver_profile_completeness(driver_user_id UUID)
RETURNS TABLE(
  is_complete BOOLEAN,
  completion_percentage INTEGER,
  missing_fields TEXT[]
) AS $$
DECLARE
  driver_record drivers%ROWTYPE;
  missing_list TEXT[] := '{}';
  total_fields INTEGER := 15; -- Augmenté avec nouveaux champs
  completed_fields INTEGER := 0;
BEGIN
  -- Récupérer le driver
  SELECT * INTO driver_record FROM drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, ARRAY['Driver not found']::TEXT[];
    RETURN;
  END IF;
  
  -- Vérifier chaque champ requis
  IF driver_record.first_name IS NOT NULL AND driver_record.first_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Prénom');
  END IF;
  
  IF driver_record.last_name IS NOT NULL AND driver_record.last_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom');
  END IF;
  
  IF driver_record.phone IS NOT NULL AND driver_record.phone != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Téléphone');
  END IF;
  
  IF driver_record.company_name IS NOT NULL AND driver_record.company_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom entreprise');
  END IF;
  
  IF driver_record.date_of_birth IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Date de naissance');
  END IF;
  
  IF driver_record.address_line1 IS NOT NULL AND driver_record.address_line1 != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Adresse');
  END IF;
  
  IF driver_record.city IS NOT NULL AND driver_record.city != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Ville');
  END IF;
  
  IF driver_record.vtc_card_number IS NOT NULL AND driver_record.vtc_card_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro carte VTC');
  END IF;
  
  IF driver_record.driving_license_number IS NOT NULL AND driver_record.driving_license_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro permis');
  END IF;
  
  IF driver_record.insurance_number IS NOT NULL AND driver_record.insurance_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro assurance');
  END IF;
  
  -- Nouveaux champs
  IF driver_record.avatar_url IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Photo de profil');
  END IF;
  
  IF driver_record.years_experience IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Années expérience');
  END IF;
  
  IF driver_record.emergency_contact_name IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Contact urgence');
  END IF;
  
  -- Vérifier qu'au moins un véhicule existe
  IF EXISTS(SELECT 1 FROM driver_vehicles WHERE driver_id = driver_record.id) THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Véhicule');
  END IF;
  
  -- Vérifier les documents essentiels
  IF (driver_record.document_urls ? 'driving_license' AND 
      driver_record.document_urls ? 'vtc_card') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Documents obligatoires');
  END IF;
  
  -- Calculer le résultat
  RETURN QUERY SELECT 
    (array_length(missing_list, 1) IS NULL OR array_length(missing_list, 1) = 0),
    (completed_fields * 100 / total_fields),
    COALESCE(missing_list, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- ÉTAPE 7: TRIGGERS POUR AUTO-UPDATE
-- =================================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drivers_updated_at 
  BEFORE UPDATE ON drivers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_vehicles_updated_at 
  BEFORE UPDATE ON driver_vehicles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- MESSAGE FINAL
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '🚀 MIGRATION FICHIERS TERMINÉE!';
  RAISE NOTICE '✅ Nouvelles colonnes ajoutées à drivers';
  RAISE NOTICE '✅ Tables driver_vehicles et driver_documents créées';
  RAISE NOTICE '✅ Politiques RLS configurées';
  RAISE NOTICE '✅ Fonction de complétude mise à jour';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Configurer les buckets Supabase Storage';
  RAISE NOTICE '2. Implémenter l''upload de fichiers';
  RAISE NOTICE '3. Mettre à jour les interfaces';
END $$;
