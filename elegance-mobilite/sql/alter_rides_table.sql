-- Ajout des colonnes nécessaires à la table rides pour éviter d'utiliser ride_details
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL,
ADD COLUMN IF NOT EXISTS pickup_lon DECIMAL,
ADD COLUMN IF NOT EXISTS dropoff_lat DECIMAL,
ADD COLUMN IF NOT EXISTS dropoff_lon DECIMAL,
ADD COLUMN IF NOT EXISTS distance DECIMAL,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS options TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Créer un trigger pour mettre à jour la colonne updated_at
CREATE OR REPLACE FUNCTION update_rides_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rides_timestamp
BEFORE UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION update_rides_timestamp();
