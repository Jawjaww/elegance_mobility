-- Drop existing tables if they exist
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS promo_usages CASCADE;
DROP TABLE IF EXISTS corporate_discounts CASCADE;
DROP TABLE IF EXISTS driver_rewards CASCADE;
DROP TABLE IF EXISTS seasonal_promotions CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS promo_type_enum CASCADE;
DROP TYPE IF EXISTS discount_type_enum CASCADE;
DROP TYPE IF EXISTS reward_type_enum CASCADE;

-- Create enums
CREATE TYPE promo_type_enum AS ENUM ('percentage', 'fixed_amount', 'free_options');
CREATE TYPE discount_type_enum AS ENUM ('volume', 'loyalty', 'corporate');
CREATE TYPE reward_type_enum AS ENUM ('commission_reduction', 'bonus_payment', 'priority_dispatch');

-- Codes promos généraux
CREATE TABLE promo_codes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    promo_type promo_type_enum NOT NULL,
    value DECIMAL NOT NULL,  -- Pourcentage ou montant selon promo_type
    min_ride_value DECIMAL,  -- Valeur minimale de course pour utiliser le code
    max_discount DECIMAL,    -- Montant maximum de réduction
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    max_uses INTEGER,        -- Nombre maximum d'utilisations total
    uses_per_user INTEGER,   -- Nombre maximum d'utilisations par utilisateur
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Suivi de l'utilisation des codes promos
CREATE TABLE promo_usages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id uuid REFERENCES promo_codes(id),
    user_id uuid REFERENCES users(id),
    ride_id uuid REFERENCES rides(id),
    discount_amount DECIMAL NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Réductions entreprises
CREATE TABLE corporate_discounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company_id uuid REFERENCES users(id),  -- Référence vers l'utilisateur entreprise
    discount_type discount_type_enum NOT NULL,
    percentage DECIMAL NOT NULL,
    min_monthly_rides INTEGER,  -- Nombre minimum de courses par mois
    total_budget DECIMAL,       -- Budget total alloué aux réductions
    remaining_budget DECIMAL,   -- Budget restant
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,      -- NULL pour durée indéterminée
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Programme de fidélité chauffeurs
CREATE TABLE driver_rewards (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id uuid REFERENCES drivers(id),
    reward_type reward_type_enum NOT NULL,
    value DECIMAL NOT NULL,     -- Valeur de la récompense (pourcentage ou montant)
    rides_threshold INTEGER,    -- Nombre de courses nécessaires
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,    -- NULL pour durée indéterminée
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Promotions saisonnières
CREATE TABLE seasonal_promotions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    discount_percentage DECIMAL NOT NULL,
    vehicle_types vehicle_type_enum[],  -- Types de véhicules concernés
    zones TEXT[],                       -- Zones géographiques concernées
    time_slots JSONB,                   -- Créneaux horaires spécifiques
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at triggers
CREATE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_promo_usages_updated_at
    BEFORE UPDATE ON promo_usages
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_corporate_discounts_updated_at
    BEFORE UPDATE ON corporate_discounts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_driver_rewards_updated_at
    BEFORE UPDATE ON driver_rewards
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_seasonal_promotions_updated_at
    BEFORE UPDATE ON seasonal_promotions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Add indices for better performance
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_usages_user ON promo_usages(user_id);
CREATE INDEX idx_promo_usages_ride ON promo_usages(ride_id);
CREATE INDEX idx_corporate_discounts_company ON corporate_discounts(company_id);
CREATE INDEX idx_driver_rewards_driver ON driver_rewards(driver_id);
CREATE INDEX idx_seasonal_promotions_dates ON seasonal_promotions(start_date, end_date);

-- Add comment
COMMENT ON DATABASE postgres IS 'Promotions and discounts tables added on 2025-02-23';
