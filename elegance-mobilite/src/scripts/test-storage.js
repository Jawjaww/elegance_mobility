// 🧪 Script de test pour Supabase Storage
// Utilise ce script pour vérifier que les buckets sont bien configurés

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testStorageSetup() {
  try {
    console.log('🔍 Vérification des buckets Supabase Storage...')
    
    // Lister les buckets existants
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Erreur:', error)
      return
    }
    
    console.log('📦 Buckets trouvés:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.id} (${bucket.public ? 'Public' : 'Privé'})`)
    })
    
    // Vérifier les buckets requis
    const requiredBuckets = ['driver-avatars', 'driver-documents', 'vehicle-photos']
    const bucketIds = buckets.map(b => b.id)
    const missingBuckets = requiredBuckets.filter(id => !bucketIds.includes(id))
    
    if (missingBuckets.length > 0) {
      console.log('⚠️  Buckets manquants:', missingBuckets)
      console.log('👉 Créez-les dans l\'interface Supabase ou utilisez le composant FileUpload')
    } else {
      console.log('✅ Tous les buckets requis sont présents!')
    }
    
    console.log('\n🔧 Test de configuration:')
    console.log('  - driver-avatars: doit être PUBLIC (pour affichage direct)')
    console.log('  - driver-documents: doit être PRIVÉ (pour sécurité)')
    console.log('  - vehicle-photos: doit être PUBLIC (pour affichage direct)')
    
  } catch (error) {
    console.error('❌ Erreur de test:', error)
  }
}

testStorageSetup()
