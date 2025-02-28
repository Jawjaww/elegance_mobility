-- Function to set up admin policies
CREATE OR REPLACE FUNCTION setup_admin_policies(admin_id UUID)
RETURNS VOID AS $$
DECLARE
    table_record RECORD;
BEGIN
    -- Create superAdmin policies for each table
    FOR table_record IN 
        SELECT tablename::text 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'CREATE POLICY "superadmin_all_%I" ON %I
             FOR ALL
             TO public
             USING (auth.uid() = ''%s''::uuid)
             WITH CHECK (auth.uid() = ''%s''::uuid)',
            table_record.tablename, table_record.tablename, admin_id, admin_id
        );
    END LOOP;
END;
$$ language plpgsql security definer;

-- Create admin role
CREATE TYPE admin_level AS ENUM ('super', 'standard');

-- Create admins table if not exists
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    level admin_level NOT NULL DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policy for admins table
CREATE POLICY "admins_select_policy" ON admins
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM admins WHERE id = auth.uid() AND level = 'super'
    ));

CREATE POLICY "admins_insert_policy" ON admins
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND level = 'super'
        )
    );

CREATE POLICY "admins_update_policy" ON admins
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND level = 'super'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND level = 'super'
        )
    );

CREATE POLICY "admins_delete_policy" ON admins
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND level = 'super'
        )
    );

-- Function to verify if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admins 
        WHERE id = user_id
    );
END;
$$ language plpgsql security definer;

-- Function to verify if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admins 
        WHERE id = user_id AND level = 'super'
    );
END;
$$ language plpgsql security definer;

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(
    user_id UUID,
    admin_level admin_level DEFAULT 'standard'
)
RETURNS VOID AS $$
BEGIN
    -- Only super admins can promote users
    IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only super admins can promote users';
    END IF;

    INSERT INTO admins (id, level)
    VALUES (user_id, admin_level)
    ON CONFLICT (id) DO UPDATE
    SET level = admin_level;
END;
$$ language plpgsql security definer;

-- Create indexes
CREATE INDEX IF NOT EXISTS admins_level_idx ON admins(level);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE admins IS 'Stores admin users and their permission levels';

