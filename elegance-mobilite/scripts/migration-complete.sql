-- Script de migration complet à exécuter dans l'éditeur SQL de Supabase

BEGIN;

-- Vérifier et migrer dropoff_lon vers dropoff_lng
DO $$ 
DECLARE
  lon_exists BOOLEAN;
  lng_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'rides' AND column_name = 'dropoff_lon') INTO lon_exists;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'rides' AND column_name = 'dropoff_lng') INTO lng_exists;
  
  IF lon_exists AND NOT lng_exists THEN
    -- Créer la nouvelle colonne
    ALTER TABLE rides ADD COLUMN dropoff_lng numeric;
    
    -- Copier les données
    UPDATE rides SET dropoff_lng = dropoff_lon;
    
    -- Supprimer l'ancienne colonne
    ALTER TABLE rides DROP COLUMN dropoff_lon;
    
    RAISE NOTICE 'dropoff_lon migré vers dropoff_lng et supprimé';
  ELSIF NOT lng_exists THEN
    -- Si aucune colonne n'existe, créer la nouvelle
    ALTER TABLE rides ADD COLUMN dropoff_lng numeric;
    RAISE NOTICE 'dropoff_lng créé (aucune donnée à migrer)';
  ELSE
    RAISE NOTICE 'dropoff_lng existe déjà, aucune action nécessaire';
  END IF;
END $$;

-- Vérifier et migrer pickup_lon vers pickup_lng
DO $$ 
DECLARE
  lon_exists BOOLEAN;
  lng_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'rides' AND column_name = 'pickup_lon') INTO lon_exists;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'rides' AND column_name = 'pickup_lng') INTO lng_exists;
  
  IF lon_exists AND NOT lng_exists THEN
    -- Créer la nouvelle colonne
    ALTER TABLE rides ADD COLUMN pickup_lng numeric;
    
    -- Copier les données
    UPDATE rides SET pickup_lng = pickup_lon;
    
    -- Supprimer l'ancienne colonne
    ALTER TABLE rides DROP COLUMN pickup_lon;
    
    RAISE NOTICE 'pickup_lon migré vers pickup_lng et supprimé';
  ELSIF NOT lng_exists THEN
    -- Si aucune colonne n'existe, créer la nouvelle
    ALTER TABLE rides ADD COLUMN pickup_lng numeric;
    RAISE NOTICE 'pickup_lng créé (aucune donnée à migrer)';
  ELSE
    RAISE NOTICE 'pickup_lng existe déjà, aucune action nécessaire';
  END IF;
END $$;

-- Migration de lat/lon dans ride_stops
DO $$ 
DECLARE
  lon_exists BOOLEAN;
  lng_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'ride_stops' AND column_name = 'lon') INTO lon_exists;
  
  SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'ride_stops' AND column_name = 'lng') INTO lng_exists;
  
  IF lon_exists AND NOT lng_exists THEN
    -- Créer la nouvelle colonne
    ALTER TABLE ride_stops ADD COLUMN lng numeric;
    
    -- Copier les données
    UPDATE ride_stops SET lng = lon;
    
    -- Supprimer l'ancienne colonne
    ALTER TABLE ride_stops DROP COLUMN lon;
    
    RAISE NOTICE 'ride_stops: Colonne lon renommée en lng';
  ELSIF NOT lng_exists THEN
    -- Si aucune colonne lng n'existe, la créer
    ALTER TABLE ride_stops ADD COLUMN lng numeric;
    RAISE NOTICE 'ride_stops: Colonne lng créée';
  END IF;
END $$;

-- Assurer que le champ admin_level existe dans la table users
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'admin_level') THEN
    ALTER TABLE users ADD COLUMN admin_level text;
    ALTER TABLE users ADD CONSTRAINT users_admin_level_check 
      CHECK ((admin_level IS NULL) OR (admin_level = ANY (ARRAY['super'::text, 'standard'::text])));
    RAISE NOTICE 'Champ admin_level ajouté à la table users';
  ELSE
    RAISE NOTICE 'Le champ admin_level existe déjà dans la table users';
  END IF;
END $$;

-- Migrer les données d'admin depuis la table admins vers users.admin_level
DO $$ 
DECLARE
  admins_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'admins') INTO admins_exists;
               
  IF admins_exists THEN
    -- Copier les données
    UPDATE users u
    SET admin_level = a.level
    FROM admins a
    WHERE u.id = a.id AND u.role = 'admin';
    
    RAISE NOTICE 'Données d''admin migrées vers users.admin_level';
  ELSE
    RAISE NOTICE 'Table admins inexistante, pas de migration nécessaire';
  END IF;
END $$;

-- Convertir les superAdmin en admin avec admin_level = 'super'
DO $$ 
BEGIN
  UPDATE users
  SET role = 'admin', admin_level = 'super'
  WHERE role = 'superAdmin';
  
  RAISE NOTICE 'Les superAdmin ont été convertis en admin avec admin_level = super';
END $$;

-- Supprimer la table admins obsolète si elle existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
    DROP TABLE admins CASCADE;
    RAISE NOTICE 'Table admins supprimée';
  END IF;
END $$;

-- Nettoyer toutes les entrées doublons ou invalides
-- Supprimer les lignes dans rides où les coordonnées sont NULL ou manquantes
DELETE FROM rides 
WHERE (pickup_lat IS NULL OR pickup_lng IS NULL OR dropoff_lat IS NULL OR dropoff_lng IS NULL)
AND status = 'pending';

-- Créer des index pour améliorer les performances des requêtes fréquentes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_status') THEN
    CREATE INDEX idx_rides_status ON rides(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_user_id') THEN
    CREATE INDEX idx_rides_user_id ON rides(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_pickup_time') THEN
    CREATE INDEX idx_rides_pickup_time ON rides(pickup_time);
  END IF;
  
  -- Ajouter un index sur le champ override_vehicle_id pour optimiser les requêtes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_override_vehicle_id') THEN
    CREATE INDEX idx_rides_override_vehicle_id ON rides(override_vehicle_id);
  END IF;
  
  -- Ajouter un index sur ride_id dans ride_stops pour améliorer les performances
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ride_stops_ride_id') THEN
    CREATE INDEX idx_ride_stops_ride_id ON ride_stops(ride_id);
  END IF;
END $$;

-- VACUUM et ANALYZE pour optimiser les performances après les modifications
ANALYZE rides;
ANALYZE users;
ANALYZE ride_stops;

COMMIT;
