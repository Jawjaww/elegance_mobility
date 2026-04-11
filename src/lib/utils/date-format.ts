/**
 * Formatage de dates pour l'application
 */

/**
 * Format une date pour l'affichage
 * @param dateString chaîne ISO ou objet Date
 * @returns date formatée
 */
export function formatDateTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Date invalide:', dateString);
      return String(dateString);
    }
    
    // Format date localisé en français
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Format heure
    const formattedTime = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Retourner le format complet
    return `${formattedDate} à ${formattedTime}`;
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return String(dateString);
  }
}

/**
 * Format une date en format court
 * @param dateString chaîne ISO ou objet Date
 * @returns date courte
 */
export function formatShortDate(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return String(dateString);
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit'
    });
  } catch (error) {
    return String(dateString);
  }
}

/**
 * Format une heure seulement
 * @param dateString chaîne ISO ou objet Date
 * @returns heure formatée
 */
export function formatTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '';
  }
}
