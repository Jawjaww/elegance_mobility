-- Création de la table ride_details pour stocker les informations additionnelles des trajets
CREATE TABLE ride_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  pickup_lat NUMERIC,
  pickup_lon NUMERIC,
  dropoff_lat NUMERIC,
  dropoff_lon NUMERIC,
  distance NUMERIC,
  duration INTEGER,
  vehicle_type TEXT,
  options TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_ride_details_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ride_details_timestamp
BEFORE UPDATE ON ride_details
FOR EACH ROW
EXECUTE FUNCTION update_ride_details_timestamp();
