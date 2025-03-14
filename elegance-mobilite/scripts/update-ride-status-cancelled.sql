-- Script pour normaliser les statuts canceled/cancelled et ajouter les nouveaux types de statut

BEGIN;

-- 1. Normaliser tous les 'canceled' en 'cancelled' pour la cohérence
UPDATE rides 
SET status = 'cancelled' 
WHERE status = 'canceled';

-- 2. Mettre à jour le type enum pour ajouter les nouveaux statuts
DO $$
DECLARE
  type_exists BOOLEAN;
BEGIN
  -- Vérifier si le type enum existe
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ride_status'
  ) INTO type_exists;

  IF type_exists THEN
    -- Ajouter les nouveaux types de statut s'ils n'existent pas déjà
    -- Note: nous ne pouvons pas vérifier individuellement chaque valeur, donc nous utilisons une approche try/catch
    
    BEGIN
      ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'driver-cancelled';
      RAISE NOTICE 'Ajouté statut driver-cancelled';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Le statut driver-cancelled existe déjà';
    END;
    
    BEGIN
      ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'client-cancelled';
      RAISE NOTICE 'Ajouté statut client-cancelled';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Le statut client-cancelled existe déjà';
    END;
    
    BEGIN
      ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'no-show';
      RAISE NOTICE 'Ajouté statut no-show';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Le statut no-show existe déjà';
    END;
    
    BEGIN
      ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'delayed';
      RAISE NOTICE 'Ajouté statut delayed';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Le statut delayed existe déjà';
    END;
    
  ELSE
    RAISE NOTICE 'Le type enum ride_status n''existe pas!';
  END IF;
END
$$;

COMMIT;
