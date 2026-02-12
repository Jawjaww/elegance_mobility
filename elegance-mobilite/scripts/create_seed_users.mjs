// Script ESM to create seed users using Supabase Admin API (service_role key)
// Usage: node --experimental-top-level-await scripts/create_seed_users.mjs

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: './.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

async function createUser(email, password, role, firstName, lastName) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
      raw_app_meta_data: { role }
    })
    if (error) {
      console.error('Error creating', email, error.message || error)
      return null
    }
    console.log('Created', email, 'id=', data.id)
    return data
  } catch (e) {
    console.error('Exception creating user', email, e.message)
    return null
  }
}

console.log('Supabase URL:', SUPABASE_URL)

try {
  const users = [
    ['admin1@elegance-mobilite.local', 'password123', 'app_super_admin', 'Admin', 'Principal'],
    ['admin2@elegance-mobilite.local', 'password123', 'app_admin', 'Admin', 'Secondaire'],
    ['jean.dupont@elegance-mobilite.local', 'password123', 'app_driver', 'Jean', 'Dupont'],
    ['marie.martin@elegance-mobilite.local', 'password123', 'app_driver', 'Marie', 'Martin'],
    ['pierre.bernard@elegance-mobilite.local', 'password123', 'app_driver', 'Pierre', 'Bernard'],
    ['client1@elegance-mobilite.local', 'password123', 'app_customer', 'Client', 'Un'],
    ['client2@elegance-mobilite.local', 'password123', 'app_customer', 'Client', 'Deux']
  ]

  for (const [email, pass, role, first, last] of users) {
    await createUser(email, pass, role, first, last)
  }

  console.log('Done')
} catch (e) {
  console.error(e)
  process.exit(1)
}
