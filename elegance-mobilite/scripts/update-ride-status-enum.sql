-- Script pour ajouter le statut 'scheduled' à l'enum ride_status

-- Commencer une transaction
BEGIN;

-- Vérifier si la valeur existe déjà dans l'enum
DO $$
DECLARE
  enum_values TEXT[];
BEGIN
  -- Récupérer les valeurs actuelles de l'enum
  SELECT array_agg(enumlabel::TEXT) INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'public.ride_status'::regtype;
  
  -- Afficher les valeurs actuelles pour information
  RAISE NOTICE 'Valeurs actuelles de l''enum ride_status: %', enum_values;
  
  -- Vérifier si la valeur 'scheduled' existe déjà
  IF NOT ('scheduled' = ANY(enum_values)) THEN
    -- Ajouter la valeur à l'enum
    ALTER TYPE public.ride_status ADD VALUE 'scheduled';
    RAISE NOTICE 'Valeur "scheduled" ajoutée à l''enum ride_status';
  ELSE
    RAISE NOTICE 'La valeur "scheduled" existe déjà dans l''enum ride_status';
  END IF;
END $$;

-- Commit de la transaction
COMMIT;
