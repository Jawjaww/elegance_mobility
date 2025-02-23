-- Verify enums
DO $$
BEGIN
  -- Check if all required enums exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type_enum') THEN
    RAISE EXCEPTION 'Missing enum: vehicle_type_enum';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
    RAISE EXCEPTION 'Missing enum: driver_status';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status') THEN
    RAISE EXCEPTION 'Missing enum: ride_status';
  END IF;
END $$;

-- Verify tables existence and structure
DO $$
DECLARE
  missing_tables text[] := ARRAY[]::text[];
  current_table text;
BEGIN
  -- Check each required table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    missing_tables := missing_tables || 'vehicles';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
    missing_tables := missing_tables || 'drivers';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rides') THEN
    missing_tables := missing_tables || 'rides';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'options') THEN
    missing_tables := missing_tables || 'options';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rates') THEN
    missing_tables := missing_tables || 'rates';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    missing_tables := missing_tables || 'users';
  END IF;

  -- Report missing tables if any
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- Verify foreign key constraints
DO $$
BEGIN
  -- Check drivers -> vehicles FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.table_name = 'drivers'
    AND kcu.column_name = 'vehicle_id'
  ) THEN
    RAISE EXCEPTION 'Missing foreign key: drivers.vehicle_id -> vehicles.id';
  END IF;

  -- Check rides -> drivers FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.table_name = 'rides'
    AND kcu.column_name = 'driver_id'
  ) THEN
    RAISE EXCEPTION 'Missing foreign key: rides.driver_id -> drivers.id';
  END IF;
END $$;

-- Verify triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehicles_updated_at') THEN
    RAISE EXCEPTION 'Missing trigger: update_vehicles_updated_at';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_drivers_updated_at') THEN
    RAISE EXCEPTION 'Missing trigger: update_drivers_updated_at';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rides_updated_at') THEN
    RAISE EXCEPTION 'Missing trigger: update_rides_updated_at';
  END IF;
END $$;

-- Verify initial data
DO $$
BEGIN
  -- Check if rates table has initial data
  IF NOT EXISTS (SELECT 1 FROM rates) THEN
    RAISE EXCEPTION 'Missing initial data in rates table';
  END IF;
  
  -- Check if options table has initial data
  IF NOT EXISTS (SELECT 1 FROM options) THEN
    RAISE EXCEPTION 'Missing initial data in options table';
  END IF;
  
  -- Check if admin user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@elegance-mobilite.fr') THEN
    RAISE EXCEPTION 'Missing admin user';
  END IF;
END $$;

-- If we reach this point, all checks passed
SELECT 'Database structure verification completed successfully.' as result;