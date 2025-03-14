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
  if (!NEXT_SUPABASE_SERVICE_ROLE_KEY) console.error('- NEXT_SUPABASE_SERVICE_ROLE_KEY');
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

async function countSuperAdmins(users) {
  return users.filter(u => u.user_metadata?.is_super_admin === true).length;
}

async function deleteSuperAdmin() {
  try {
    // Si un email spécifique a été fourni comme argument
    const specificEmail = process.argv[2];
    let emailToDelete;

    if (specificEmail) {
      emailToDelete = specificEmail;
    } else {
      const response = await prompts({
        type: 'text',
        name: 'email',
        message: 'Enter super admin email to delete',
        validate: value => value.includes('@') ? true : 'Please enter a valid email'
      });

      if (!response.email) {
        console.log('Operation canceled');
        process.exit(0);
      }
      emailToDelete = response.email;
    }

    // Récupérer tous les utilisateurs pour compter les super admins
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      process.exit(1);
    }

    const user = users.find(u => u.email === emailToDelete);

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    // Vérifier si c'est un super admin
    if (!user.user_metadata?.is_super_admin) {
      console.error('This user is not a super admin');
      process.exit(1);
    }

    // Vérifier s'il reste d'autres super admins
    const superAdminCount = await countSuperAdmins(users);
    if (superAdminCount <= 1) {
      console.error('Cannot delete the last super admin');
      process.exit(1);
    }

    // Supprimer l'utilisateur
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting super admin:', deleteError);
      process.exit(1);
    }

    console.log(`Super admin ${emailToDelete} deleted successfully`);
    process.exit(0);

  } catch (error) {
    console.error('Unexpected error:', error);
    console.error('Detailed error:', error.message);
    process.exit(1);
  }
}

deleteSuperAdmin().catch(error => {
  console.error('Unexpected error:', error);
  console.error('Detailed error:', error.message);
  process.exit(1);
});
