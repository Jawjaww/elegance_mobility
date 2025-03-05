-- Check if first_name and last_name columns exist before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'first_name'
    ) THEN
        ALTER TABLE drivers ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'last_name'
    ) THEN
        ALTER TABLE drivers ADD COLUMN last_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add company_name and company_phone columns if they do not exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE drivers ADD COLUMN company_name TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'company_phone'
    ) THEN
        ALTER TABLE drivers ADD COLUMN company_phone TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add employee_phone and employee_name columns if they do not exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'employee_phone'
    ) THEN
        ALTER TABLE drivers ADD COLUMN employee_phone TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'employee_name'
    ) THEN
        ALTER TABLE drivers ADD COLUMN employee_name TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Make last_name required after setting default values
ALTER TABLE drivers ALTER COLUMN last_name SET NOT NULL;

-- Grant necessary permissions
GRANT SELECT ON drivers TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;

-- Update the user_profiles view with SECURITY INVOKER
CREATE OR REPLACE VIEW user_profiles WITH (security_invoker = on) AS
SELECT 
    u.id,
    au.email,
    u.role,
    u.created_at,
    u.updated_at
FROM users u
JOIN auth.users au ON au.id = u.id;

-- Drop existing policy if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE policyname = 'user_profiles_policy' 
        AND tablename = 'users'
    ) THEN
        EXECUTE 'DROP POLICY user_profiles_policy ON users';
    END IF;
END $$;

-- Create or update policy for user_profiles access
CREATE POLICY user_profiles_policy
    ON users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'superAdmin')
        )
    );

COMMENT ON VIEW user_profiles IS 'User profiles with role information - Updated on 2025-03-03';
COMMENT ON COLUMN drivers.first_name IS 'The first name of the driver';
COMMENT ON COLUMN drivers.last_name IS 'The last name of the driver';
COMMENT ON COLUMN drivers.company_name IS 'The name of the company';
COMMENT ON COLUMN drivers.company_phone IS 'The phone number of the company';
COMMENT ON COLUMN drivers.employee_phone IS 'The phone number of the employee';
COMMENT ON COLUMN drivers.employee_name IS 'The name of the employee making the reservation';