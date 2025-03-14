-- Script pour supprimer l'enum 'canceled' devenu obsolète
-- Note: Il n'est pas possible de supprimer une valeur d'enum en SQL standard
-- Cette manipulation nécessite de recréer l'enum

BEGIN;

-- 1. Vérifier qu'aucune ligne n'utilise encore le statut 'canceled'
DO $$
DECLARE
  obsolete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO obsolete_count
  FROM rides
  WHERE status = 'canceled';
  
  IF obsolete_count > 0 THEN
    RAISE EXCEPTION 'Il reste % réservation(s) avec le statut obsolète "canceled"', obsolete_count;
  ELSE
    RAISE NOTICE 'Aucune réservation avec le statut "canceled" détectée. Sûr de continuer.';
  END IF;
END $$;

-- 2. Afficher les valeurs actuelles de l'enum ride_status avant modification
DO $$
DECLARE
  enum_values TEXT[];
BEGIN
  SELECT array_agg(enumlabel::TEXT) INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'public.ride_status'::regtype;
  
  RAISE NOTICE 'Valeurs actuelles de l''enum ride_status: %', enum_values;
END $$;

-- 3. Créer un nouvel enum temporaire sans la valeur obsolète
CREATE TYPE ride_status_new AS ENUM (
  'pending', 
  'scheduled', 
  'in-progress', 
  'completed', 
  'client-canceled',
  'driver-canceled',
  'admin-canceled',
  'no-show',
  'delayed',
  'vehicle-breakdown',
  'incident',
  'disputed',
  'multi-stop'
);

-- 4. Mise à jour de la table temporairement
ALTER TABLE rides 
  ALTER COLUMN status TYPE ride_status_new 
  USING status::text::ride_status_new;

-- 5. Suppression de l'ancien type
DROP TYPE ride_status;

-- 6. Renommage du nouveau type
ALTER TYPE ride_status_new RENAME TO ride_status;

-- 7. Afficher les valeurs actuelles de l'enum ride_status après modification
DO $$
DECLARE
  enum_values TEXT[];
BEGIN
  SELECT array_agg(enumlabel::TEXT) INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'public.ride_status'::regtype;
  
  RAISE NOTICE 'Nouvelles valeurs de l''enum ride_status: %', enum_values;
END $$;

COMMIT;
