/**
 * Script de diagnostic pour la table drivers
 * Vérifie l'accès aux données et les politiques RLS
 */

const { createClient } = require('@supabase/supabase-js')
const { readFileSync } = require('fs')
const { resolve } = require('path')

// Charger les variables d'environnement
const envPath = resolve(process.cwd(), '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      process.env[key.trim()] = value
    }
  })
} catch (error) {
  console.error('Erreur lors du chargement de .env.local:', error.message)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

console.log('🔍 Diagnostic de la table drivers\n')

// Client avec clé anonyme (comme l'app)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

// Client avec clé service (admin)
const supabaseService = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

async function testDriversAccess() {
  console.log('📋 Test 1: Accès avec clé anonyme (comme l\'app)')
  try {
    const { data, error, count } = await supabaseAnon
      .from('drivers')
      .select('*', { count: 'exact' })
      .limit(5)
    
    console.log('   Résultat:', {
      count,
      dataLength: data?.length || 0,
      error: error?.message || null,
      data: data?.slice(0, 2) // Afficher seulement les 2 premiers pour la lisibilité
    })
  } catch (err) {
    console.log('   Erreur:', err.message)
  }

  if (supabaseService) {
    console.log('\n📋 Test 2: Accès avec clé service (admin)')
    try {
      const { data, error, count } = await supabaseService
        .from('drivers')
        .select('*', { count: 'exact' })
        .limit(5)
      
      console.log('   Résultat:', {
        count,
        dataLength: data?.length || 0,
        error: error?.message || null,
        data: data?.slice(0, 2)
      })
    } catch (err) {
      console.log('   Erreur:', err.message)
    }
  }

  console.log('\n📋 Test 3: Vérification de l\'existence de la table')
  try {
    const { data, error } = await supabaseAnon.rpc('pg_tables')
    if (error) {
      console.log('   Impossible de vérifier les tables:', error.message)
    } else {
      const driversTable = data?.find(table => table.tablename === 'drivers')
      console.log('   Table drivers trouvée:', !!driversTable)
    }
  } catch (err) {
    console.log('   Erreur lors de la vérification:', err.message)
  }

  console.log('\n📋 Test 4: Test des politiques RLS')
  try {
    // Simuler l'accès d'un utilisateur admin
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'admin@example.com', // Remplacer par un email admin réel
      password: 'temp123'
    })

    if (authError) {
      console.log('   Impossible de se connecter comme admin:', authError.message)
    } else {
      console.log('   Connexion admin réussie, test d\'accès...')
      const { data, error } = await supabaseAnon
        .from('drivers')
        .select('id, first_name, last_name, status')
        .limit(3)
      
      console.log('   Résultat avec session admin:', {
        dataLength: data?.length || 0,
        error: error?.message || null,
        data
      })

      // Déconnexion
      await supabaseAnon.auth.signOut()
    }
  } catch (err) {
    console.log('   Erreur test RLS:', err.message)
  }
}

async function suggestSolutions() {
  console.log('\n💡 Solutions possibles:')
  console.log('1. Créer des politiques RLS pour la table drivers')
  console.log('2. Vérifier que des données existent dans la table')
  console.log('3. S\'assurer que l\'utilisateur admin a les bonnes permissions')
  console.log('4. Vérifier la structure de la table drivers')
  
  console.log('\n📝 Politique RLS suggérée pour la table drivers:')
  console.log(`
-- Permettre aux admins de voir tous les drivers
CREATE POLICY "Admins can view all drivers" ON drivers
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);

-- Permettre aux drivers de voir leurs propres données
CREATE POLICY "Drivers can view own data" ON drivers
FOR SELECT USING (
  auth.uid() = user_id
);

-- Permettre aux admins de modifier les drivers
CREATE POLICY "Admins can update drivers" ON drivers
FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);
  `)
}

// Exécuter les tests
testDriversAccess()
  .then(() => suggestSolutions())
  .then(() => {
    console.log('\n✅ Diagnostic terminé')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Erreur lors du diagnostic:', err)
    process.exit(1)
  })
