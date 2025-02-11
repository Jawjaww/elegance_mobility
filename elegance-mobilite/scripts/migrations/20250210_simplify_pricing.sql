-- Sauvegarde des anciennes données
CREATE TABLE rates_backup AS SELECT * FROM rates;
CREATE TABLE options_backup AS SELECT * FROM options;

-- Suppression des anciennes tables
DROP TABLE IF EXISTS rates CASCADE;
DROP TABLE IF EXISTS options CASCADE;

-- Création de la nouvelle table des tarifs
CREATE TABLE rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_type TEXT NOT NULL,
    price_per_km DECIMAL NOT NULL,
    base_price DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_vehicle_type UNIQUE (vehicle_type)
);

-- Création de la nouvelle table des options
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_option_name UNIQUE (name)
);

-- Migration des données des tarifs
-- Conversion des anciens tarifs en nouveau format
INSERT INTO rates (vehicle_type, price_per_km, base_price)
SELECT 
    type,
    COALESCE(peak_rate, base_rate) as price_per_km,  -- Utilise le tarif pic comme prix au km
    COALESCE(base_rate, 0) as base_price             -- Utilise le tarif de base comme prix fixe
FROM rates_backup;

-- Migration des options si elles existent
INSERT INTO options (name, price)
SELECT name, price
FROM options_backup;

-- Création des triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rates_updated_at
    BEFORE UPDATE ON rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_updated_at
    BEFORE UPDATE ON options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Création des index pour améliorer les performances
CREATE INDEX idx_rates_vehicle_type ON rates(vehicle_type);
CREATE INDEX idx_options_name ON options(name);

-- Commentaires sur les tables
COMMENT ON TABLE rates IS 'Tarifs simplifiés avec prix de base et prix au kilomètre';
COMMENT ON TABLE options IS 'Options disponibles pour les réservations';

-- Protection contre la suppression accidentelle
ALTER TABLE rates SET (user_catalog_table = true);
ALTER TABLE options SET (user_catalog_table = true);