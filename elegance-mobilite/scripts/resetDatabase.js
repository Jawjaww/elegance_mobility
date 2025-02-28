#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const ora = require('ora');
const prompts = require('prompts');

// Load environment variables
dotenv.config({ path: '.env.local' });

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function resetDatabase() {
  const spinner = ora('Preparing database reset...').start();

  try {
    // Confirm reset
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: '⚠️  WARNING: This will delete all data. Are you sure?',
      initial: false
    });

    if (!response.value) {
      spinner.info('Database reset cancelled');
      process.exit(0);
    }

    spinner.text = 'Dropping existing data...';

    // Execute complete reset
    const { error: resetError } = await supabase
      .rpc('reset_database');

    if (resetError) throw resetError;

    spinner.text = 'Applying migrations...';

    // Apply migrations in order
    const migrations = [
      '20250225_01_init_schema.sql',
      '20250225_02_promotions.sql',
      '20250225_03_policies.sql',
      '20250226_01_setup_admin_policies.sql'
    ];

    for (const migration of migrations) {
      const { error: migrationError } = await supabase
        .rpc('execute_migration', { migration_file: migration });

      if (migrationError) throw migrationError;
      spinner.text = `Applied ${migration}`;
    }

    spinner.text = 'Verifying database state...';

    const { error: verifyError } = await supabase
      .rpc('verify_database');

    if (verifyError) throw verifyError;

    spinner.succeed('Database reset and initialized successfully');

  } catch (error) {
    spinner.fail('Failed to reset database');
    console.error(error);
    process.exit(1);
  }
}

resetDatabase();
