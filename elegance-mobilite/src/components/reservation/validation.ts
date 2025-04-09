/**
 * Utilitaires de validation des données de réservation
 */

export interface RideData {
  pickup_address: string;
  pickup_lat?: number;
  pickup_lon?: number;
  dropoff_address: string;
  dropoff_lat?: number;
  dropoff_lon?: number;
  pickup_time: string;
  vehicle_type: string;
  user_id?: string;
  estimated_price?: number;
  status?: string;
  distance?: number;
  duration?: number;
  options?: string[];
}

/**
 * Vérifie et corrige les données de réservation pour éviter les erreurs côté serveur
 * @param data Données de réservation brutes
 * @returns Données corrigées et nettoyées
 */
export function sanitizeRideData(data: Partial<RideData>): RideData {
  // S'assurer que les coordonnées sont des nombres 
  const pickup_lat = typeof data.pickup_lat === 'string' ? parseFloat(data.pickup_lat) : data.pickup_lat;
  const pickup_lon = typeof data.pickup_lon === 'string' ? parseFloat(data.pickup_lon) : data.pickup_lon;
  const dropoff_lat = typeof data.dropoff_lat === 'string' ? parseFloat(data.dropoff_lat) : data.dropoff_lat;
  const dropoff_lon = typeof data.dropoff_lon === 'string' ? parseFloat(data.dropoff_lon) : data.dropoff_lon;
  
  // S'assurer que les valeurs numériques sont des nombres et pas NaN
  const distance = typeof data.distance === 'string' ? parseFloat(data.distance) : data.distance;
  const duration = typeof data.duration === 'string' ? parseFloat(data.duration) : data.duration;
  const estimated_price = typeof data.estimated_price === 'string' ? 
    parseFloat(data.estimated_price) : data.estimated_price;
  
  // Valeurs par défaut pour les champs obligatoires
  const sanitized: RideData = {
    pickup_address: data.pickup_address || "",
    dropoff_address: data.dropoff_address || "",
    pickup_time: data.pickup_time || new Date().toISOString(),
    vehicle_type: data.vehicle_type || "STANDARD",
    
    // Ajouter seulement les valeurs non-nulles
    ...(pickup_lat !== undefined && !isNaN(pickup_lat) && { pickup_lat }),
    ...(pickup_lon !== undefined && !isNaN(pickup_lon) && { pickup_lon }),
    ...(dropoff_lat !== undefined && !isNaN(dropoff_lat) && { dropoff_lat }),
    ...(dropoff_lon !== undefined && !isNaN(dropoff_lon) && { dropoff_lon }),
    ...(distance !== undefined && !isNaN(distance) && { distance }),
    ...(duration !== undefined && !isNaN(duration) && { duration }),
    ...(estimated_price !== undefined && !isNaN(estimated_price) && { estimated_price }),
    
    // Valeurs optionnelles
    ...(data.user_id && { user_id: data.user_id }),
    ...(data.status && { status: data.status }),
    
    // S'assurer que options est un tableau
    ...(Array.isArray(data.options) && { options: data.options })
  };
  
  return sanitized;
}

/**
 * Vérifie si les données de réservation sont valides
 * @param data Données de réservation
 * @returns boolean indiquant si les données sont valides
 */
export function validateRideData(data: RideData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Vérifier les champs obligatoires
  if (!data.pickup_address) errors.push("L'adresse de départ est requise");
  if (!data.dropoff_address) errors.push("L'adresse de destination est requise");
  if (!data.pickup_time) errors.push("L'heure de prise en charge est requise");
  
  // Vérifier la validité des coordonnées
  if (data.pickup_lat !== undefined && (isNaN(data.pickup_lat) || data.pickup_lat < -90 || data.pickup_lat > 90)) {
    errors.push("La latitude de départ est invalide");
  }
  
  if (data.pickup_lon !== undefined && (isNaN(data.pickup_lon) || data.pickup_lon < -180 || data.pickup_lon > 180)) {
    errors.push("La longitude de départ est invalide");
  }
  
  if (data.dropoff_lat !== undefined && (isNaN(data.dropoff_lat) || data.dropoff_lat < -90 || data.dropoff_lat > 90)) {
    errors.push("La latitude de destination est invalide");
  }
  
  if (data.dropoff_lon !== undefined && (isNaN(data.dropoff_lon) || data.dropoff_lon < -180 || data.dropoff_lon > 180)) {
    errors.push("La longitude de destination est invalide");
  }
  
  return { 
    valid: errors.length === 0,
    errors 
  };
}
