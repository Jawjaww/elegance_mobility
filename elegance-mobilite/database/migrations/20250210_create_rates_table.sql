-- Créer ou mettre à jour la table rates
DROP TABLE IF EXISTS rates;

CREATE TABLE rates (
    id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL UNIQUE,
    price_per_km DECIMAL(10, 2) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_vehicle_types CHECK (vehicle_type IN ('STANDARD', 'LUXURY', 'VAN'))
);

-- Insérer les données initiales
INSERT INTO rates (vehicle_type, price_per_km, base_price) VALUES
    ('STANDARD', 2.50, 45.00),
    ('LUXURY', 3.50, 75.00),
    ('VAN', 3.00, 55.00);
