#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const prompts = require('prompts');

// Charger les variables d'environnement du répertoire parent
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !serviceRoleKey) {
  console.error('Missing environment variables. Please check .env.local in the root directory');
  process.exit(1);
}

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function deleteUser() {
  try {
    const response = await prompts({
      type: 'text',
      name: 'email',
      message: 'Enter the email of the user to delete',
      validate: value => value.includes('@') ? true : 'Please enter a valid email'
    });

    if (!response.email) {
      console.log('Operation cancelled');
      process.exit(0);
    }

    // Récupérer l'ID de l'utilisateur
    const { data: user, error: fetchError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', response.email)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      process.exit(1);
    }

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    // Supprimer le rôle PostgreSQL si existant
    const role_name = 'user_' + response.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      await supabase.rpc('drop_user_role', { role_name });
    } catch (error) {
      console.warn('Warning: Could not drop PostgreSQL role:', error);
    }

    // Supprimer l'utilisateur
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      process.exit(1);
    }

    console.log(`User ${response.email} deleted successfully`);
    process.exit(0);

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

deleteUser();
