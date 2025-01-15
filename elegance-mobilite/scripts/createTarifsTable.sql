-- Create simplified rates table
CREATE TABLE rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('STANDARD', 'PREMIUM', 'VIP')),
    base_rate NUMERIC(5,2) NOT NULL,
    peak_rate NUMERIC(5,2) NOT NULL,
    night_rate NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and set permissions
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;

-- Policy for read access
CREATE POLICY "Enable read access for all users" ON rates
FOR SELECT USING (true);

-- Policy for insert/update access (admin only)
CREATE POLICY "Enable insert/update for admin" ON rates
FOR INSERT WITH CHECK (auth.role() = 'service_role');
