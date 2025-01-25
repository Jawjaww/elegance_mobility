-- Function to drop table if it exists
CREATE OR REPLACE FUNCTION drop_table_if_exists(table_name text) 
RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables 
        WHERE table_name = drop_table_if_exists.table_name
    ) THEN
        EXECUTE format('DROP TABLE %I CASCADE', table_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create rates table
CREATE OR REPLACE FUNCTION create_rates_table()
RETURNS void AS $$
BEGIN
    EXECUTE '
        CREATE TABLE rates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            type TEXT NOT NULL CHECK (type IN (''STANDARD'', ''PREMIUM'', ''VIP'')),
            base_rate NUMERIC(5,2) NOT NULL,
            peak_rate NUMERIC(5,2) NOT NULL,
            night_rate NUMERIC(5,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now()) NOT NULL
        );

        ALTER TABLE rates ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Enable read access for all users" ON rates
        FOR SELECT USING (true);

        CREATE POLICY "Enable insert/update for admin" ON rates
        FOR INSERT WITH CHECK (auth.role() = ''service_role'');
    ';
END;
$$ LANGUAGE plpgsql;

-- Create initial rates table
SELECT create_rates_table();
