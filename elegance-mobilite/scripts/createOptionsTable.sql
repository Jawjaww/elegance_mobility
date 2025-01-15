-- Create options table
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    rate NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and set permissions
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- Policy for read access
CREATE POLICY "Enable read access for all users" ON options
FOR SELECT USING (true);

-- Policy for insert/update access (admin only)
CREATE POLICY "Enable insert/update for admin" ON options
FOR INSERT WITH CHECK (auth.role() = 'service_role');
