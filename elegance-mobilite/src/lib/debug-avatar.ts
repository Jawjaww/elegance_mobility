import { supabase } from '@/lib/database/client'

// Script de debug pour tester l'affichage des avatars
export async function debugAvatarDisplay() {
  console.log('🔍 DEBUG AVATAR - Début du test')
  
  try {
    // 1. Tester la connexion à Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    
    console.log('✅ User connecté:', user?.id)
    
    // 2. Récupérer le profil chauffeur
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, avatar_url, user_id')
      .eq('user_id', user?.id)
      .single()
    
    if (driverError) throw driverError
    
    console.log('✅ Driver trouvé:', {
      id: driver.id,
      name: `${driver.first_name} ${driver.last_name}`,
      avatar_url: driver.avatar_url,
      avatar_exists: !!driver.avatar_url
    })
    
    // 3. Tester l'accès au Storage
    if (driver.avatar_url) {
      try {
        const response = await fetch(driver.avatar_url)
        console.log('✅ Avatar accessible via URL:', {
          url: driver.avatar_url,
          status: response.status,
          contentType: response.headers.get('content-type')
        })
      } catch (fetchError) {
        console.error('❌ Erreur accès avatar:', fetchError)
      }
    } else {
      console.log('⚠️ Aucun avatar_url défini')
    }
    
    // 4. Lister les buckets Storage
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) throw bucketsError
    
    console.log('✅ Buckets disponibles:', buckets.map(b => b.name))
    
    // 5. Lister les fichiers dans driver-avatars
    const { data: files, error: filesError } = await supabase.storage
      .from('driver-avatars')
      .list(driver.id)
    
    if (filesError) {
      console.error('❌ Erreur listage fichiers:', filesError)
    } else {
      console.log('✅ Fichiers dans driver-avatars/' + driver.id + ':', files?.map(f => f.name))
    }
    
    return {
      success: true,
      driver,
      avatarExists: !!driver.avatar_url,
      avatarUrl: driver.avatar_url
    }
    
  } catch (error) {
    console.error('❌ Erreur debug avatar:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Test d'upload d'avatar
export async function testAvatarUpload(file: File, driverId: string) {
  console.log('🔍 TEST UPLOAD AVATAR - Début')
  
  try {
    const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`
    const filePath = `${driverId}/${fileName}`
    
    console.log('📁 Upload vers:', filePath)
    
    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('driver-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) throw uploadError
    
    console.log('✅ Upload réussi:', uploadData)
    
    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('driver-avatars')
      .getPublicUrl(filePath)
    
    const publicUrl = urlData.publicUrl
    console.log('✅ URL publique:', publicUrl)
    
    // Mettre à jour la base de données
    const { data: updateData, error: updateError } = await supabase
      .from('drivers')
      .update({ avatar_url: publicUrl })
      .eq('id', driverId)
      .select()
    
    if (updateError) throw updateError
    
    console.log('✅ DB mise à jour:', updateData)
    
    return {
      success: true,
      publicUrl,
      updateData
    }
    
  } catch (error) {
    console.error('❌ Erreur test upload:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}
