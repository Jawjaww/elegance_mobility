import { supabase } from '@/lib/database/client'

/**
 * Vérifie si la session actuelle est valide et nettoie les sessions fantômes
 * Utilisé quand un utilisateur a été supprimé de la DB mais que sa session persiste
 */
export async function cleanupGhostSession() {
  try {
    // Vérifier s'il y a une session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return { isValid: false, wasGhost: false }
    }

    // Vérifier si l'utilisateur existe toujours
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('🧹 Session fantôme détectée - nettoyage en cours...')
      
      // Nettoyer la session locale
      await supabase.auth.signOut()
      
      // Nettoyer le localStorage/sessionStorage si nécessaire
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
      }
      
      return { isValid: false, wasGhost: true }
    }

    return { isValid: true, wasGhost: false, user }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de session:', error)
    
    // En cas d'erreur, nettoyer par sécurité
    await supabase.auth.signOut()
    return { isValid: false, wasGhost: true }
  }
}

/**
 * Hook utilitaire pour vérifier automatiquement les sessions fantômes
 */
export async function useAuthCleanup() {
  const result = await cleanupGhostSession()
  
  if (result.wasGhost) {
    console.log('✅ Session fantôme nettoyée avec succès')
  }
  
  return result
}
