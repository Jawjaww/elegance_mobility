#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const prompts = require('prompts');
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
  console.error('Missing required environment variables:');
  if (!NEXT_PUBLIC_SUPABASE_URL) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!NEXT_SUPABASE_SERVICE_ROLE_KEY) console.error('- NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file in the project root directory');
  process.exit(1);
}

console.log('Creating Supabase client...');
console.log('URL:', NEXT_PUBLIC_SUPABASE_URL);

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

async function createSuperAdmin() {
  console.log('Starting super admin creation process...');
  
  try {
    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Enter super admin email',
        validate: value => value.includes('@') ? true : 'Please enter a valid email'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter super admin password',
        validate: value => value.length >= 8 ? true : 'Password must be at least 8 characters'
      }
    ]);

    if (!response.email || !response.password) {
      console.log('Operation cancelled');
      process.exit(0);
    }

    console.log('Creating super admin account...');

    // Créer l'utilisateur avec le rôle admin et is_super_admin
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: response.email,
      password: response.password,
      email_confirm: true,
      user_metadata: {
        is_super_admin: true
      },
      app_metadata: {
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating super admin:', createError);
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
        role: 'admin'
      }]);

    if (userError) {
      console.error('Error creating users entry:', userError);
      // Supprimer l'utilisateur auth créé puisque l'insertion dans users a échoué
      await supabase.auth.admin.deleteUser(user.id);
      process.exit(1);
    }

    console.log(`
Super admin created successfully:
Email: ${user.email}
ID: ${user.id}
Role: admin
Is Super Admin: true
    `);

    process.exit(0);

  } catch (error) {
    console.error('Failed to create super admin:', error);
    console.error('Detailed error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin().catch(error => {
  console.error('Unexpected error:', error);
  console.error('Detailed error:', error.message);
  process.exit(1);
});
