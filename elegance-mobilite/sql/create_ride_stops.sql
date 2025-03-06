-- Création d'une table pour gérer les arrêts intermédiaires (multi-stop)
CREATE TABLE public.ride_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL, -- Ordre de l'arrêt dans l'itinéraire
  address TEXT NOT NULL,       -- Adresse de l'arrêt
  lat NUMERIC NULL,            -- Latitude
  lon NUMERIC NULL,            -- Longitude
  estimated_arrival TIMESTAMP WITH TIME ZONE NULL, -- Heure d'arrivée estimée
  estimated_wait_time INTEGER NULL,               -- Temps d'attente estimé en minutes
  notes TEXT NULL,                                -- Notes pour le chauffeur
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes d'arrêts par trajet
CREATE INDEX ride_stops_ride_id_idx ON ride_stops(ride_id);

-- Index composite pour optimiser le tri par ordre d'arrêt
CREATE INDEX ride_stops_ride_id_order_idx ON ride_stops(ride_id, stop_order);

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_ride_stops_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ride_stops_timestamp
BEFORE UPDATE ON ride_stops
FOR EACH ROW
EXECUTE FUNCTION update_ride_stops_timestamp();
