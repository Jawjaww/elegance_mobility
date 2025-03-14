-- Script en deux transactions pour éviter l'erreur "unsafe use of new value"

-- PREMIÈRE TRANSACTION: Ajouter les nouvelles valeurs d'enum
BEGIN;

DO $$
DECLARE
  type_exists BOOLEAN;
BEGIN
  -- Vérifier si le type enum existe
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ride_status'
  ) INTO type_exists;

  IF type_exists THEN
    -- Ajouter les nouveaux types de statut avec l'orthographe standardisée
    BEGIN
      ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'client-canceled';
      RAISE NOTICE 'Ajouté statut client-canceled';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Le statut client-canceled existe déjà';
    END;
    
    BEGIN
      ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'driver-canceled';
      RAISE NOTICE 'Ajouté statut driver-canceled';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Le statut driver-canceled existe déjà';
    END;
    
    BEGIN
      ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'admin-canceled';
      RAISE NOTICE 'Ajouté statut admin-canceled';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'Le statut admin-canceled existe déjà';
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

-- DEUXIÈME TRANSACTION: Maintenant que les valeurs sont disponibles, effectuer la mise à jour
BEGIN;

-- Mettre à jour les statuts 'cancelled' vers 'client-canceled'
UPDATE rides 
SET status = 'client-canceled' 
WHERE status = 'cancelled';

-- Afficher un résumé des statuts après la migration (syntaxe corrigée)
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Résumé des statuts après migration:';
  FOR r IN 
    SELECT status, count(*) as nombre 
    FROM rides 
    GROUP BY status
    ORDER BY count(*) DESC
  LOOP
    RAISE NOTICE '% : %', r.status, r.nombre;
  END LOOP;
END
$$;

COMMIT;
