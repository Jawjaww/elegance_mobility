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

async function deleteUser() {
  console.log('Starting user deletion process...');
  
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

    // Get user directly from auth schema
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('Error searching users:', searchError);
      process.exit(1);
    }

    const user = users.find(u => u.email === response.email);

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log(`Found user:
ID: ${user.id}
Email: ${user.email}
Role: ${user.role || 'authenticated'}
    `);

    // Try to remove from admins table first
    console.log('Cleaning up admin records if any...');
    await supabase
      .from('admins')
      .delete()
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) {
          console.log('Note: User was not in admins table');
        } else {
          console.log('Removed admin record if it existed');
        }
      });

    console.log('Deleting user account...');

    // Delete the user using admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id
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

deleteUser().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
