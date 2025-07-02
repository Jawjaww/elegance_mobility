// 🚀 Script d'initialisation automatique du Storage Supabase
// Ce script s'exécute au démarrage de l'application pour s'assurer que tout est configuré

import { useState, useEffect } from 'react'
import { checkStorageBuckets, getStorageSetupInstructions } from './supabase-storage-setup'

let isStorageChecked = false

export async function initializeStorage() {
  if (isStorageChecked) {
    return { success: true, message: 'Storage déjà vérifié' }
  }

  try {
    console.log('🚀 Vérification du Storage Supabase...')
    
    const result = await checkStorageBuckets()
    
    if (result.success) {
      isStorageChecked = true
      console.log('✅ Storage Supabase prêt')
      
      return {
        success: true,
        message: 'Storage Supabase opérationnel'
      }
    } else {
      console.warn('⚠️ Buckets Storage manquants:', result.error)
      const instructions = getStorageSetupInstructions()
      
      return {
        success: false,
        message: result.error || 'Erreur de vérification',
        instructions: instructions.instructions,
        missingBuckets: result.missingBuckets
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification Storage:', error)
    return {
      success: false,
      message: 'Erreur de vérification du Storage',
      error
    }
  }
}

// Hook pour initialiser le Storage dans les composants React
export function useStorageInit() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<string[]>([])

  useEffect(() => {
    initializeStorage()
      .then(result => {
        if (result.success) {
          setIsReady(true)
        } else {
          setError(result.message || 'Erreur inconnue')
          if (result.instructions) {
            setInstructions(result.instructions)
          }
        }
      })
      .catch(err => {
        setError('Erreur d\'initialisation du Storage')
        console.error(err)
      })
  }, [])

  return { isReady, error, instructions }
}
