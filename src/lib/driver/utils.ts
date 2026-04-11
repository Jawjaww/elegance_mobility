/**
 * Utilitaires pour le driver dashboard
 */

// Calculer distance entre 2 points (Haversine)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Vibration pattern (court, pause, court, pause, LONG)
export function vibrateDevice(pattern: number[] = [200, 100, 200, 100, 500]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

// Son de notification
export function playNotificationSound(src: string = '/sounds/new-ride.mp3', volume: number = 0.8) {
  try {
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {
      // Ignore audio play errors (user interaction required)
    })
  } catch (e) {
    // Ignore errors
  }
}

// Formatter la durée en minutes/heures
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

// Formatter le prix
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

// Formatter la distance
export function formatDistance(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`
  return `${km.toFixed(1)} km`
}
