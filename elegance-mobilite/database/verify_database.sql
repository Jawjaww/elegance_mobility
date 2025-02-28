-- Helper function to log check results
CREATE OR REPLACE FUNCTION log_check(check_name text, status text)
RETURNS void AS $$
BEGIN
    RAISE NOTICE '% : %', check_name, status;
END;
$$ LANGUAGE plpgsql;

-- Start verification process
DO $$
DECLARE
    missing_tables text[];
    missing_types text[];
    missing_functions text[];
    missing_policies text[];
    temp_record record;
    table_count int;
    schema_valid boolean := true;
BEGIN
    RAISE NOTICE 'Starting database verification...';
    
    -- 1. Check required tables exist
    missing_tables := ARRAY[]::text[];
    FOR temp_record IN
        SELECT unnest(ARRAY[
            'users',
            'admins',
            'drivers',
            'vehicles',
            'rides',
            'rates',
            'promo_codes'
        ]) as table_name
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = temp_record.table_name
        ) THEN
            missing_tables := array_append(missing_tables, temp_record.table_name);
            schema_valid := false;
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) IS NULL THEN
        PERFORM log_check('Required tables', 'OK');
    ELSE
        PERFORM log_check('Missing tables', array_to_string(missing_tables, ', '));
    END IF;

    -- 2. Check required types exist
    missing_types := ARRAY[]::text[];
    FOR temp_record IN
        SELECT unnest(ARRAY[
            'admin_level',
            'ride_status',
            'vehicle_type'
        ]) as type_name
    LOOP
        IF NOT EXISTS (
            SELECT FROM pg_type t 
            JOIN pg_namespace n ON t.typnamespace = n.oid 
            WHERE n.nspname = 'public' 
            AND t.typname = temp_record.type_name
        ) THEN
            missing_types := array_append(missing_types, temp_record.type_name);
            schema_valid := false;
        END IF;
    END LOOP;

    IF array_length(missing_types, 1) IS NULL THEN
        PERFORM log_check('Required types', 'OK');
    ELSE
        PERFORM log_check('Missing types', array_to_string(missing_types, ', '));
    END IF;

    -- 3. Check required functions exist
    missing_functions := ARRAY[]::text[];
    FOR temp_record IN
        SELECT unnest(ARRAY[
            'is_admin',
            'is_super_admin',
            'promote_to_admin',
            'verify_database'
        ]) as function_name
    LOOP
        IF NOT EXISTS (
            SELECT FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' 
            AND p.proname = temp_record.function_name
        ) THEN
            missing_functions := array_append(missing_functions, temp_record.function_name);
            schema_valid := false;
        END IF;
    END LOOP;

    IF array_length(missing_functions, 1) IS NULL THEN
        PERFORM log_check('Required functions', 'OK');
    ELSE
        PERFORM log_check('Missing functions', array_to_string(missing_functions, ', '));
    END IF;

    -- 4. Check RLS is enabled on critical tables
    FOR temp_record IN
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'admins', 'rides', 'rates')
    LOOP
        IF NOT EXISTS (
            SELECT FROM pg_tables 
            WHERE tablename = temp_record.tablename 
            AND rowsecurity = true
        ) THEN
            RAISE WARNING 'Row Level Security not enabled on table: %', temp_record.tablename;
            schema_valid := false;
        END IF;
    END LOOP;

    PERFORM log_check('Row Level Security', CASE WHEN schema_valid THEN 'OK' ELSE 'FAILED' END);

    -- Final status
    IF schema_valid THEN
        RAISE NOTICE 'Database verification completed successfully';
    ELSE
        RAISE EXCEPTION 'Database verification failed - See above warnings for details';
    END IF;

END;
$$ LANGUAGE plpgsql;
