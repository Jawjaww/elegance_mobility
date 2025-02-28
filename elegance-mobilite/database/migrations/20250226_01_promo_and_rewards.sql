-- Drop existing tables if they exist
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS promo_usages CASCADE;
DROP TABLE IF EXISTS corporate_discounts CASCADE;
DROP TABLE IF EXISTS driver_rewards CASCADE;
DROP TABLE IF EXISTS seasonal_promotions CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS promo_type_enum CASCADE;
DROP TYPE IF EXISTS discount_type_enum CASCADE;
DROP TYPE IF EXISTS reward_type_enum CASCADE;

-- Create enums for promotion types
CREATE TYPE promo_type_enum AS ENUM ('percentage', 'fixed_amount', 'free_options');
CREATE TYPE discount_type_enum AS ENUM ('volume', 'loyalty', 'corporate');
CREATE TYPE reward_type_enum AS ENUM ('commission_reduction', 'bonus_payment', 'priority_dispatch');

-- General promotion codes table
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    promo_type promo_type_enum NOT NULL,
    value DECIMAL NOT NULL,  -- Percentage or amount based on promo_type
    min_ride_value DECIMAL,  -- Minimum ride value to use code
    max_discount DECIMAL,    -- Maximum discount amount
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    max_uses INTEGER,        -- Total maximum uses
    uses_per_user INTEGER,   -- Maximum uses per user
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Track promotion code usage
CREATE TABLE promo_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id UUID REFERENCES promo_codes(id),
    user_id UUID REFERENCES users(id),
    ride_id UUID REFERENCES rides(id),
    discount_amount DECIMAL NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Corporate discounts table
CREATE TABLE corporate_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company_id UUID REFERENCES users(id),  -- Reference to the corporate user
    discount_type discount_type_enum NOT NULL,
    percentage DECIMAL NOT NULL,
    min_monthly_rides INTEGER,  -- Minimum rides per month
    total_budget DECIMAL,       -- Total discount budget
    remaining_budget DECIMAL,   -- Remaining budget
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,      -- NULL for indefinite
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Driver rewards program
CREATE TABLE driver_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id),
    reward_type reward_type_enum NOT NULL,
    value DECIMAL NOT NULL,     -- Value of the reward (percentage or amount)
    rides_threshold INTEGER,    -- Required number of rides
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,    -- NULL for indefinite duration
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seasonal promotions
CREATE TABLE seasonal_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    discount_percentage DECIMAL NOT NULL,
    vehicle_types vehicle_type_enum[],  -- Types of vehicles affected
    zones TEXT[],                       -- Geographic zones
    time_slots JSONB,                   -- Specific time slots
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
CREATE INDEX idx_promo_codes_dates ON promo_codes(start_date, end_date);
CREATE INDEX idx_promo_usages_user ON promo_usages(user_id);
CREATE INDEX idx_promo_usages_ride ON promo_usages(ride_id);
CREATE INDEX idx_corporate_discounts_company ON corporate_discounts(company_id);
CREATE INDEX idx_driver_rewards_driver ON driver_rewards(driver_id);
CREATE INDEX idx_seasonal_promotions_dates ON seasonal_promotions(start_date, end_date);

-- Add comment
COMMENT ON DATABASE postgres IS 'Promotions and rewards system added - Created on 2025-02-25';