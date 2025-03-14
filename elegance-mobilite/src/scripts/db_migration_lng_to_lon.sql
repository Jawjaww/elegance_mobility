-- Script de migration pour convertir les colonnes lng en lon

-- Vérifier si les colonnes pickup_lon et dropoff_lon existent déjà
DO $$
BEGIN
  -- Si les colonnes n'existent pas, les créer et copier les données
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'pickup_lon') THEN
    ALTER TABLE rides ADD COLUMN pickup_lon DECIMAL;
    UPDATE rides SET pickup_lon = pickup_lng;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'dropoff_lon') THEN
    ALTER TABLE rides ADD COLUMN dropoff_lon DECIMAL;
    UPDATE rides SET dropoff_lon = dropoff_lng;
  END IF;

  -- De même pour les arrêts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_stops' AND column_name = 'lon') THEN
    ALTER TABLE ride_stops ADD COLUMN lon DECIMAL;
    UPDATE ride_stops SET lon = lng;
  END IF;
END $$;

-- Ajouter des commentaires sur les colonnes
COMMENT ON COLUMN rides.pickup_lon IS 'Longitude du point de départ (standardisé sur lon)';
COMMENT ON COLUMN rides.dropoff_lon IS 'Longitude du point d''arrivée (standardisé sur lon)';
COMMENT ON COLUMN ride_stops.lon IS 'Longitude de l''arrêt (standardisé sur lon)';
