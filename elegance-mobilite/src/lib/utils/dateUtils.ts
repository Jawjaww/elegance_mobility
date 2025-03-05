/**
 * Formate une date en français (jour de la semaine, date et heure)
 */
export function formatDate(date: Date | undefined | null): string {
  if (!date) return "Non spécifié";
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return date.toLocaleString('fr-FR');
  }
}

/**
 * Formate une durée en minutes en texte lisible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "moins d'une minute";
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours} h`;
  } else {
    return `${hours} h ${remainingMinutes} min`;
  }
}

/**
 * Vérifie si une date est dans le passé
 */
export function isDateInPast(date: Date): boolean {
  const now = new Date();
  return date < now;
}

/**
 * Ajoute des minutes à une date
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
