-- Migration pour aligner la structure de la table rides avec le nouveau modèle
-- Gestion de la colonne dropoff_lon -> dropoff_lng et pickup_lon -> pickup_lng

-- Commencer une transaction pour garantir la cohérence des opérations
BEGIN;

-- Vérifier si la colonne dropoff_lng existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'dropoff_lng') THEN
        -- Si dropoff_lon existe, renommer en dropoff_lng
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'dropoff_lon') THEN
            ALTER TABLE rides RENAME COLUMN dropoff_lon TO dropoff_lng;
            RAISE NOTICE 'Colonne dropoff_lon renommée en dropoff_lng';
        ELSE
            -- Si aucune colonne n'existe, créer dropoff_lng
            ALTER TABLE rides ADD COLUMN dropoff_lng numeric;
            RAISE NOTICE 'Colonne dropoff_lng créée';
        END IF;
    ELSE
        RAISE NOTICE 'Colonne dropoff_lng existe déjà';
    END IF;
END $$;

-- Vérifier si la colonne pickup_lng existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'pickup_lng') THEN
        -- Si pickup_lon existe, renommer en pickup_lng
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'pickup_lon') THEN
            ALTER TABLE rides RENAME COLUMN pickup_lon TO pickup_lng;
            RAISE NOTICE 'Colonne pickup_lon renommée en pickup_lng';
        ELSE
            -- Si aucune colonne n'existe, créer pickup_lng
            ALTER TABLE rides ADD COLUMN pickup_lng numeric;
            RAISE NOTICE 'Colonne pickup_lng créée';
        END IF;
    ELSE
        RAISE NOTICE 'Colonne pickup_lng existe déjà';
    END IF;
END $$;

-- Créer un script JavaScript qui accompagne la migration SQL pour exécuter cette migration
COMMIT;
