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

async function deleteAdmin() {
  console.log('Starting admin deletion process...');
  
  try {
    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Enter user email to delete',
        validate: value => value.includes('@') ? true : 'Please enter a valid email'
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: (prev) => `Are you sure you want to delete the user with email ${prev}?`,
        initial: false
      }
    ]);

    if (!response.email || !response.confirm) {
      console.log('Operation cancelled');
      process.exit(0);
    }

    console.log('Looking up user...');

    // Get user by email directly from auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(
      response.email
    );

    if (userError) {
      console.error('Error finding user:', userError);
      process.exit(1);
    }

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Found user, checking if admin...');

    // Try to remove from admins table if exists (won't error if not found)
    const { error: adminError } = await supabase
      .from('admins')
      .delete()
      .eq('id', user.user.id);

    if (adminError) {
      console.log('Note: User was not in admins table');
    }

    console.log('Deleting user account...');

    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.user.id
    );

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      process.exit(1);
    }

    console.log(`Successfully deleted user: ${response.email}`);
    process.exit(0);

  } catch (error) {
    console.error('Failed to delete user:', error);
    console.error('Detailed error:', error.message);
    process.exit(1);
  }
}

deleteAdmin().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
