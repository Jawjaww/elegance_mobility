// 🔧 Configuration automatique des buckets Supabase Storage
import { supabase } from '@/lib/database/client'

export async function setupStorageBuckets() {
  try {
    // Vérifier si les buckets existent déjà
    const { data: existingBuckets } = await supabase.storage.listBuckets()
    const bucketIds = existingBuckets?.map(bucket => bucket.id) || []

    const requiredBuckets = [
      {
        id: 'driver-avatars',
        name: 'driver-avatars',
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      {
        id: 'driver-documents', 
        name: 'driver-documents',
        public: false,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      },
      {
        id: 'vehicle-photos',
        name: 'vehicle-photos', 
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    ]

    const results: Array<{bucket: string, status: 'exists' | 'created' | 'error', data?: any, error?: any}> = []
    
    for (const bucket of requiredBuckets) {
      if (!bucketIds.includes(bucket.id)) {
        console.log(`🔧 Création du bucket: ${bucket.id}`)
        
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        })
        
        if (error) {
          console.error(`❌ Erreur création bucket ${bucket.id}:`, error)
          results.push({ bucket: bucket.id, status: 'error', error })
        } else {
          console.log(`✅ Bucket ${bucket.id} créé avec succès`)
          results.push({ bucket: bucket.id, status: 'created', data })
        }
      } else {
        console.log(`✅ Bucket ${bucket.id} existe déjà`)
        results.push({ bucket: bucket.id, status: 'exists' })
      }
    }

    return { success: true, results }
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des buckets:', error)
    return { success: false, error }
  }
}

export async function checkStorageBuckets() {
  try {
    // Vérifier si les buckets existent
    const { data: existingBuckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Erreur lors de la vérification des buckets:', error)
      return { success: false, error: 'Impossible de vérifier les buckets' }
    }

    const bucketIds = existingBuckets?.map(bucket => bucket.id) || []
    const requiredBuckets = ['driver-avatars', 'driver-documents', 'vehicle-photos']
    const missingBuckets = requiredBuckets.filter(id => !bucketIds.includes(id))

    if (missingBuckets.length > 0) {
      return {
        success: false,
        error: `Buckets manquants: ${missingBuckets.join(', ')}. Créez-les dans Supabase Dashboard.`,
        missingBuckets
      }
    }

    console.log('✅ Tous les buckets Storage sont présents')
    return { success: true, bucketsExist: true }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    return { success: false, error: 'Erreur de connexion au Storage' }
  }
}

// Instructions pour créer les buckets manuellement
export function getStorageSetupInstructions() {
  return {
    message: "Buckets Storage manquants",
    instructions: [
      "1. Allez dans votre Supabase Dashboard → Storage → Buckets",
      "2. Créez ces buckets :",
      "   • driver-avatars (Public: ✅, Limite: 5MB, Types: image/*)",
      "   • driver-documents (Public: ❌, Limite: 10MB, Types: image/*,pdf)",
      "   • vehicle-photos (Public: ✅, Limite: 5MB, Types: image/*)",
      "3. Rechargez la page une fois créés"
    ]
  }
}

// Function pour vérifier les permissions Storage
export async function checkStoragePermissions(driverId: string) {
  try {
    // Test upload d'un fichier temporaire pour vérifier les permissions
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const testPath = `${driverId}/test-permissions.txt`
    
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .upload(testPath, testFile)
    
    if (!error) {
      // Nettoyer le fichier test
      await supabase.storage
        .from('driver-documents')
        .remove([testPath])
      
      return { hasPermissions: true }
    }
    
    return { hasPermissions: false, error }
    
  } catch (error) {
    return { hasPermissions: false, error }
  }
}

// Get public URL pour un fichier
export function getStorageUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Get signed URL pour les documents privés (driver-documents)
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      console.error('Erreur création URL signée:', error)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Erreur génération URL signée:', error)
    return null
  }
}

// Helper pour obtenir l'URL appropriée selon le type de bucket
export async function getFileUrl(bucket: string, path: string) {
  // Pour les buckets publics, utiliser getPublicUrl
  if (bucket === 'driver-avatars' || bucket === 'vehicle-photos') {
    return getStorageUrl(bucket, path)
  }
  
  // Pour driver-documents (privé), utiliser une URL signée
  if (bucket === 'driver-documents') {
    return await getSignedUrl(bucket, path)
  }
  
  return getStorageUrl(bucket, path)
}
