#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const prompts = require('prompts');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement du répertoire parent
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error(`File not found: ${envPath}`);
  console.error('Please make sure .env.local exists in the project root directory');
  process.exit(1);
}

dotenv.config({ path: envPath });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

console.log('Creating Supabase client...');

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createUser() {
  console.log('Starting user creation process...');
  
  try {
    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Enter user email',
        validate: value => value.includes('@') ? true : 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter user password',
        validate: value => value.length >= 8 ? true : 'Password must be at least 8 characters'
      },
      {
        type: 'select',
        name: 'role',
        message: 'Select user role',
        choices: [
          { title: 'Client', value: 'client' },
          { title: 'Driver', value: 'driver' }
        ],
        initial: 0
      }
    ]);

    if (!response.email || !response.password) {
      console.log('Operation canceled');
      process.exit(0);
    }

    console.log('Creating user account...');

    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: response.email,
      password: response.password,
      email_confirm: true,
      user_metadata: {},
      app_metadata: {
        role: response.role
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

    // Créer l'entrée correspondante dans la table users
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        role: response.role
      }]);

    if (userError) {
      console.error('Error creating users entry:', userError);
      // Supprimer l'utilisateur auth créé puisque l'insertion dans users a échoué
      await supabase.auth.admin.deleteUser(user.id);
      process.exit(1);
    }

    console.log(`
User created successfully:
Email: ${user.email}
ID: ${user.id}
Role: ${response.role}
    `);

    process.exit(0);
  } catch (error) {
    console.error('Failed to create user:', error);
    console.error('Detailed error:', error.message);
    process.exit(1);
  }
}

createUser().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
