-- Ajout des valeurs manquantes à l'enum driver_status si nécessaire
DO $$ BEGIN
    ALTER TYPE public.driver_status ADD VALUE IF NOT EXISTS 'pending_validation' BEFORE 'active';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Mise à jour des contraintes de validation pour la table drivers
ALTER TABLE public.drivers
  -- Suppression des anciennes contraintes si elles existent
  DROP CONSTRAINT IF EXISTS proper_phone,
  DROP CONSTRAINT IF EXISTS future_vtc_expiry,
  DROP CONSTRAINT IF EXISTS future_license_expiry,
  DROP CONSTRAINT IF EXISTS future_insurance_expiry,
  DROP CONSTRAINT IF EXISTS valid_rating,
  DROP CONSTRAINT IF EXISTS required_fields;

-- Ajout des nouvelles contraintes
ALTER TABLE public.drivers
  ADD CONSTRAINT proper_phone 
    CHECK (phone ~ '^[0-9+\s()-]+$'),
  ADD CONSTRAINT future_vtc_expiry 
    CHECK (vtc_card_expiry_date > CURRENT_DATE),
  ADD CONSTRAINT future_license_expiry 
    CHECK (driving_license_expiry_date > CURRENT_DATE),
  ADD CONSTRAINT future_insurance_expiry 
    CHECK (insurance_expiry_date IS NULL OR insurance_expiry_date > CURRENT_DATE),
  ADD CONSTRAINT valid_rating 
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  ADD CONSTRAINT required_fields
    CHECK (
      first_name IS NOT NULL AND
      last_name IS NOT NULL AND
      phone IS NOT NULL AND
      vtc_card_number IS NOT NULL AND
      driving_license_number IS NOT NULL AND
      vtc_card_expiry_date IS NOT NULL AND
      driving_license_expiry_date IS NOT NULL
    );

-- Création d'un trigger pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_driver_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_drivers_timestamp ON public.drivers;
CREATE TRIGGER update_drivers_timestamp
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_timestamp();

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Users can view their own driver profile" ON public.drivers;
DROP POLICY IF EXISTS "Users can create their own driver profile" ON public.drivers;
DROP POLICY IF EXISTS "Admins can update driver status" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update their own info" ON public.drivers;

-- Politique de lecture
CREATE POLICY "Users can view their own driver profile"
ON public.drivers FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.role() IN ('app_admin', 'app_super_admin')
);

-- Politique d'insertion
CREATE POLICY "Users can create their own driver profile"
ON public.drivers FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  status = 'pending_validation'::driver_status
);

-- Politique de mise à jour pour les admins (statut)
CREATE POLICY "Admins can update driver status"
ON public.drivers FOR UPDATE
USING (auth.role() IN ('app_admin', 'app_super_admin'));

-- Politique de mise à jour pour les chauffeurs (leurs propres informations)
CREATE POLICY "Drivers can update their own info"
ON public.drivers FOR UPDATE
USING (
  auth.uid() = user_id AND 
  auth.role() = 'app_driver'
);

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON public.drivers(created_at);

COMMENT ON TABLE public.drivers IS 'Table des chauffeurs avec validation et contraintes';