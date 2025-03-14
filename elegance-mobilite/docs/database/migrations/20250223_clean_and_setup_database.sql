-- Drop existing tables if they exist
DROP TABLE IF EXISTS rates CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS vehicle_type_enum CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS ride_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enums
CREATE TYPE vehicle_type_enum AS ENUM ('STANDARD', 'PREMIUM', 'ELECTRIC', 'VAN');
CREATE TYPE driver_status AS ENUM ('active', 'inactive');
CREATE TYPE ride_status AS ENUM ('unassigned', 'pending', 'in-progress', 'completed', 'canceled');
CREATE TYPE user_role AS ENUM ('superAdmin', 'admin', 'client', 'driver');

-- Create users table first (as it's referenced by drivers)
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ
);

-- Create vehicles table
CREATE TABLE vehicles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate TEXT NOT NULL UNIQUE,
    vehicle_type vehicle_type_enum NOT NULL,
    vehicle_model TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create drivers table with reference to users
CREATE TABLE drivers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status driver_status NOT NULL DEFAULT 'inactive',
    avatar_url TEXT,
    vehicle_id uuid REFERENCES vehicles(id),
    -- Required VTC information
    vtc_card_number TEXT NOT NULL,
    driving_license_number TEXT NOT NULL,
    vtc_card_expiry_date DATE NOT NULL,
    driving_license_expiry_date DATE NOT NULL,
    -- Additional professional information
    insurance_number TEXT,
    insurance_expiry_date DATE,
    -- Performance metrics
    rating DECIMAL CHECK (rating >= 0 AND rating <= 5),
    total_rides INTEGER DEFAULT 0,
    -- Preferences and capabilities
    languages_spoken TEXT[],
    preferred_zones TEXT[],
    availability_hours JSONB,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id),
    UNIQUE(vtc_card_number),
    UNIQUE(driving_license_number)
);

-- Create rides table
CREATE TABLE rides (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id),
    status ride_status NOT NULL DEFAULT 'pending',
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_time TIMESTAMPTZ NOT NULL,
    estimated_price DECIMAL,
    driver_id uuid REFERENCES drivers(id),
    override_vehicle_id uuid REFERENCES vehicles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create options table
CREATE TABLE options (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price DECIMAL NOT NULL CHECK (price >= 0),
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create rates table
CREATE TABLE rates (
    id SERIAL PRIMARY KEY,
    vehicle_type vehicle_type_enum NOT NULL UNIQUE,
    price_per_km DECIMAL NOT NULL CHECK (price_per_km >= 0),
    base_price DECIMAL NOT NULL CHECK (base_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
    BEFORE UPDATE ON rides
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_options_updated_at
    BEFORE UPDATE ON options
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_rates_updated_at
    BEFORE UPDATE ON rates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Add comment to document migration
COMMENT ON DATABASE postgres IS 'Initial database setup with core tables and triggers - Created on 2025-02-23';
