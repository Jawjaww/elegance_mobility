-- Initial database schema with Supabase Auth integration
-- ===================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create enums
CREATE TYPE vehicle_type_enum AS ENUM ('STANDARD', 'PREMIUM', 'ELECTRIC', 'VAN');
CREATE TYPE driver_status AS ENUM ('active', 'inactive');
CREATE TYPE ride_status AS ENUM ('unassigned', 'pending', 'in-progress', 'completed', 'cancelled');

-- Create users table linked to auth.users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('superAdmin', 'admin', 'client', 'driver')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate TEXT NOT NULL UNIQUE,
    vehicle_type vehicle_type_enum NOT NULL,
    vehicle_model TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create drivers table with reference to users
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status driver_status NOT NULL DEFAULT 'inactive',
    avatar_url TEXT,
    vehicle_id UUID REFERENCES vehicles(id),
    vtc_card_number TEXT NOT NULL UNIQUE,
    driving_license_number TEXT NOT NULL UNIQUE,
    vtc_card_expiry_date DATE NOT NULL,
    driving_license_expiry_date DATE NOT NULL,
    insurance_number TEXT,
    insurance_expiry_date DATE,
    rating DECIMAL CHECK (rating >= 0 AND rating <= 5),
    total_rides INTEGER DEFAULT 0,
    languages_spoken TEXT[],
    preferred_zones TEXT[],
    availability_hours JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create rides table
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    status ride_status NOT NULL DEFAULT 'pending',
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_time TIMESTAMPTZ NOT NULL,
    estimated_price DECIMAL,
    driver_id UUID REFERENCES drivers(id),
    override_vehicle_id UUID REFERENCES vehicles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create options table
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg(
            format('CREATE TRIGGER update_%I_updated_at
                   BEFORE UPDATE ON %I
                   FOR EACH ROW
                   EXECUTE PROCEDURE update_updated_at_column();', table_name, table_name),
            E'\n'
        )
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN ('users', 'vehicles', 'drivers', 'rides', 'options', 'rates')
    );
END $$;

-- Create view for user profiles
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    u.id,
    au.email,
    u.role,
    u.created_at,
    u.updated_at
FROM users u
JOIN auth.users au ON au.id = u.id;

COMMENT ON DATABASE postgres IS 'Initial schema setup with Supabase Auth integration - Created on 2025-02-25';
