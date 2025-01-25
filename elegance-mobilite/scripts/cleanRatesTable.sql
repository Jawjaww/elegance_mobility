-- Supprime les doublons en gardant le plus récent
WITH ranked_rates AS (
    SELECT 
        id,
        type,
        base_rate,
        peak_rate,
        night_rate,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at DESC) AS rn
    FROM rates
)

DELETE FROM rates
WHERE id IN (
    SELECT id
    FROM ranked_rates
    WHERE rn > 1
);

-- Ajoute la contrainte UNIQUE si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'rates'::regclass
        AND conname = 'rates_type_unique'
    ) THEN
        ALTER TABLE rates
        ADD CONSTRAINT rates_type_unique UNIQUE (type);
    END IF;
END $$;
