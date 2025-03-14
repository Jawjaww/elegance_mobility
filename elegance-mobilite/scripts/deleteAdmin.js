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

async function deleteAdmin() {
  try {
    const response = await prompts({
      type: 'text',
      name: 'email',
      message: 'Enter admin email to delete',
      validate: value => value.includes('@') ? true : 'Please enter a valid email'
    });

    if (!response.email) {
      console.log('Operation canceled');
      process.exit(0);
    }

    // Récupérer l'utilisateur via l'API auth
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    
    const user = users.find(u => u.email === response.email);

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      process.exit(1);
    }

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    // Vérifier si c'est un super admin
    if (user.user_metadata?.is_super_admin) {
      console.error('Cannot delete a super admin');
      process.exit(1);
    }

    // Vérifier si c'est un admin
    if (user.app_metadata?.role !== 'admin') {
      console.error('This user is not an admin');
      process.exit(1);
    }

    // Supprimer le rôle PostgreSQL
    const role_name = 'user_' + response.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      await supabase.rpc('revoke_admin_role', { admin_email: response.email });
    } catch (error) {
      console.warn('Warning: Could not revoke admin role:', error);
    }

    // Supprimer l'utilisateur
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting admin:', deleteError);
      process.exit(1);
    }

    console.log(`Admin ${response.email} deleted successfully`);
    process.exit(0);

  } catch (error) {
    console.error('Unexpected error:', error);
    console.error('Detailed error:', error.message);
    process.exit(1);
  }
}

deleteAdmin().catch(error => {
  console.error('Unexpected error:', error);
  console.error('Detailed error:', error.message);
  process.exit(1);
});
