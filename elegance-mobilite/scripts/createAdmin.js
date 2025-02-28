#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const prompts = require('prompts');

// Load environment variables
dotenv.config({ path: '.env.local' });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

console.log('Creating Supabase client...');

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createSuperAdmin() {
  console.log('Starting admin creation process...');
  
  try {
    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Enter admin email',
        validate: value => value.includes('@') ? true : 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter admin password',
        validate: value => value.length >= 8 ? true : 'Password must be at least 8 characters'
      }
    ]);

    if (!response.email || !response.password) {
      console.log('Operation cancelled');
      process.exit(0);
    }

    console.log('Creating user account...');

    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: response.email,
      password: response.password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        is_superadmin: true
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      process.exit(1);
    }

    if (!user) {
      console.error('No user returned after creation');
      process.exit(1);
    }

    console.log('User created, setting up admin permissions...');

    // Add to admins table
    const { error: adminError } = await supabase
      .from('admins')
      .insert({
        id: user.id,
        email: user.email,
        is_superadmin: true
      });

    if (adminError) {
      console.error('Error adding admin record:', adminError);
      process.exit(1);
    }

    console.log(`
Super admin created successfully:
Email: ${user.email}
ID: ${user.id}
Role: ${user.user_metadata.role}
    `);
    
    process.exit(0);

  } catch (error) {
    console.error('Failed to create admin:', error);
    console.error('Detailed error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
