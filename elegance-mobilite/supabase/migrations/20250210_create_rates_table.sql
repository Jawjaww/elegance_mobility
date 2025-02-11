-- Reset la table si elle existe
DROP TABLE IF EXISTS rates;

-- Créer la table avec les contraintes
CREATE TABLE rates (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL UNIQUE,
    price_per_km DECIMAL(10, 2) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer l'enum pour les types de véhicules
DO $$ BEGIN
    CREATE TYPE vehicle_type_enum AS ENUM ('STANDARD', 'LUXURY', 'VAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter la contrainte pour les types de véhicules
ALTER TABLE rates
    ADD CONSTRAINT valid_vehicle_types 
    CHECK (vehicle_type::vehicle_type_enum IN ('STANDARD', 'LUXURY', 'VAN'));

-- Insérer les données initiales
INSERT INTO rates (vehicle_type, price_per_km, base_price) VALUES
    ('STANDARD', 2.50, 45.00),
    ('LUXURY', 3.50, 75.00),
    ('VAN', 3.00, 55.00);
