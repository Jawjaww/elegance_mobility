-- Crée ou met à jour l'enum driver_status
DO $$ BEGIN
    CREATE TYPE public.driver_status AS ENUM (
        'inactive',
        'pending_validation',
        'active',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN
        -- Si l'enum existe déjà, ajoutons les valeurs manquantes
        ALTER TYPE public.driver_status ADD VALUE IF NOT EXISTS 'pending_validation' BEFORE 'active';
END $$;

-- Vérifie les valeurs actuelles de l'enum
COMMENT ON TYPE public.driver_status IS 'Statuts possibles pour un chauffeur : inactive (compte créé), pending_validation (en attente de validation), active (validé), suspended (suspendu)';