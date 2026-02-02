// Supabase Edge Function pour calcul de prix avec intégration OpenStreetMap
// Version corrigée sans fallback Haversine

// @ts-ignore - Ces fonctions sont disponibles globalement dans l'environnement Supabase Edge Functions
// serve, createClient, et Deno sont fournis par l'environnement d'exécution

interface RateRecord {
  base_price: number;
  price_per_km: number;
  min_price: number;
}

interface RideRecord {
  id: string;
  vehicle_type: string;
  pickup_lat?: number;
  pickup_lon?: number;
  dropoff_lat?: number;
  dropoff_lon?: number;
  distance?: number;
  duration?: number;
  options?: string[];
}

interface RideUpdateData {
  final_price?: number;
  estimated_price?: number;
  distance?: number;
  duration?: number;
}

interface AuditLog {
  event_type: string;
  service: string;
  ride_id: string;
  calculated_price?: number;
  metadata?: Record<string, unknown>;
}

interface OSMRouteResponse {
  routes: Array<{
    distance: number; // en mètres
    duration: number; // en secondes
  }>;
}

// Helper function for comparing arrays
const arraysAreEqual = (a: string[], b: string[]): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

const logAudit = async (supabaseClient: any, log: AuditLog) => {
  try {
    const { error } = await supabaseClient.from('audit_logs').insert([log]);
    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

/**
 * Calcule la distance et durée via OpenStreetMap Routing Service
 * SANS FALLBACK - Si OSM échoue, on retourne une erreur
 */
const calculateRouteFromOSM = async (
  pickupLat: number,
  pickupLon: number,
  dropoffLat: number,
  dropoffLon: number
): Promise<{ distance: number; duration: number; source: string }> => {
  // Configuration du timeout pour OSM
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 secondes pour laisser plus de temps

  try {
    // Appel à l'API OpenStreetMap Routing Service (OSRM)
    const osmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupLon},${pickupLat};${dropoffLon},${dropoffLat}?overview=false&alternatives=false&steps=false`;
    
    console.log('[OSM] Calling route API:', osmUrl);
    
    const response = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EleganceMobilite/1.0'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OSM API responded with status: ${response.status}`);
    }

    const data: OSMRouteResponse = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found from OSM');
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000; // Convertir en km
    const durationMin = route.duration / 60; // Convertir en minutes

    console.log('[OSM] Route calculated successfully:', {
      distance: distanceKm,
      duration: durationMin
    });

    return {
      distance: Math.round(distanceKm * 100) / 100, // Arrondir à 2 décimales
      duration: Math.round(durationMin),
      source: 'osm'
    };

  } catch (error) {
    clearTimeout(timeout);
    console.error('[OSM] Route calculation failed:', error);
    throw new Error(`Impossible de calculer la route via OpenStreetMap: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Point d'entrée principal selon les bonnes pratiques Supabase Edge Functions
// @ts-ignore
serve(async (req: Request) => {
  try {
    console.log('[DEBUG] Edge function price-calculator-with-osm démarrée', {
      method: req.method,
      url: req.url
    });

    // CORS pour les requêtes OPTIONS - CRUCIAL: statut 200 au lieu de 204
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Créer le client Supabase avec les variables d'environnement
    // @ts-ignore
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier le client Supabase
    if (!supabaseClient?.from) {
      console.error('Client Supabase invalide');
      return new Response(JSON.stringify({
        error: 'Configuration Supabase invalide'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      });
    }

    // Parser le payload
    const rawBody = await req.text();
    console.log('[DEBUG] Raw payload received:', rawBody);
    
    const payload = JSON.parse(rawBody);
    console.log('[DEBUG] Parsed payload:', payload);

    // Vérifier la structure du payload
    if (!payload || !payload.new) {
      console.error('Invalid payload structure', {
        receivedKeys: Object.keys(payload || {}),
        payload: payload
      });
      return new Response(JSON.stringify({
        error: 'Payload invalide - objet "new" manquant',
        received: Object.keys(payload || {}),
        payload: payload
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      });
    }

    const ride: RideRecord = payload.new;
    const oldRide = payload.old || {};
    const isUpdate = ride.id && payload.old?.id;

    console.log('[DEBUG] Processing ride:', {
      id: ride.id,
      operation: isUpdate ? 'update' : 'insert',
      vehicle_type: ride.vehicle_type,
      has_coordinates: !!(ride.pickup_lat && ride.pickup_lon && ride.dropoff_lat && ride.dropoff_lon),
      coordinates: {
        pickup: { lat: ride.pickup_lat, lon: ride.pickup_lon },
        dropoff: { lat: ride.dropoff_lat, lon: ride.dropoff_lon }
      }
    });

    // Validation des données requises
    if (!ride.vehicle_type) {
      console.error('vehicle_type missing', { received: ride.vehicle_type });
      return new Response(JSON.stringify({
        error: 'vehicle_type manquant',
        received: ride.vehicle_type
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      });
    }

    // Validation des coordonnées requises
    if (!ride.pickup_lat || !ride.pickup_lon || !ride.dropoff_lat || !ride.dropoff_lon) {
      console.error('Coordonnées manquantes', {
        pickup_lat: ride.pickup_lat,
        pickup_lon: ride.pickup_lon,
        dropoff_lat: ride.dropoff_lat,
        dropoff_lon: ride.dropoff_lon
      });
      return new Response(JSON.stringify({
        error: 'Coordonnées de départ et destination requises',
        received: {
          pickup_lat: ride.pickup_lat,
          pickup_lon: ride.pickup_lon,
          dropoff_lat: ride.dropoff_lat,
          dropoff_lon: ride.dropoff_lon
        }
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      });
    }

    // Pour les mises à jour, vérifier si recalcul nécessaire
    if (isUpdate) {
      const coordinatesChanged = 
        ride.pickup_lat !== oldRide.pickup_lat ||
        ride.pickup_lon !== oldRide.pickup_lon ||
        ride.dropoff_lat !== oldRide.dropoff_lat ||
        ride.dropoff_lon !== oldRide.dropoff_lon;
      
      const vehicleTypeChanged = ride.vehicle_type !== oldRide.vehicle_type;
      const optionsChanged = Array.isArray(ride.options) && Array.isArray(oldRide.options) ?
        !arraysAreEqual(ride.options, oldRide.options) :
        ride.options !== oldRide.options;

      if (!coordinatesChanged && !vehicleTypeChanged && !optionsChanged) {
        console.log('[DEBUG] No significant changes detected, skipping recalculation');
        return new Response(JSON.stringify({
          success: true,
          message: 'Aucune modification nécessitant un recalcul du prix'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
          }
        });
      }
    }

    // Calculer la distance et durée via OSM (OBLIGATOIRE - pas de fallback)
    let finalDistance: number;
    let calculatedDuration: number;
    let routeSource: string;

    try {
      const routeData = await calculateRouteFromOSM(
        ride.pickup_lat,
        ride.pickup_lon,
        ride.dropoff_lat,
        ride.dropoff_lon
      );
      
      finalDistance = routeData.distance;
      calculatedDuration = routeData.duration;
      routeSource = routeData.source;

      console.log('[DEBUG] Route calculation completed:', {
        distance: finalDistance,
        duration: calculatedDuration,
        source: routeSource
      });

    } catch (error) {
      console.error('[DEBUG] Route calculation failed:', error);
      
      await logAudit(supabaseClient, {
        event_type: 'price_calculation_error',
        service: 'price_calculator_osm',
        ride_id: ride.id,
        metadata: {
          error: 'Échec du calcul de route OSM',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      });
      
      return new Response(JSON.stringify({
        error: 'Impossible de calculer la route. Veuillez réessayer.',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      });
    }

    // Récupérer les tarifs
    const { data: rate, error: rateError } = await supabaseClient
      .from('rates')
      .select('base_price, price_per_km, min_price')
      .eq('vehicle_type', ride.vehicle_type)
      .single();

    if (rateError || !rate) {
      console.error('Error fetching rates', {
        error: rateError,
        vehicleType: ride.vehicle_type
      });
      
      await logAudit(supabaseClient, {
        event_type: 'price_calculation_error',
        service: 'price_calculator_osm',
        ride_id: ride.id,
        metadata: {
          error: 'Erreur lors de la récupération des tarifs',
          details: rateError,
          vehicleType: ride.vehicle_type
        }
      });
      
      return new Response(JSON.stringify({
        error: 'Erreur lors de la récupération des tarifs',
        details: rateError,
        vehicleType: ride.vehicle_type
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      });
    }

    console.log('[DEBUG] Rate found:', rate);

    // Calculer le prix de base
    let totalPrice = rate.base_price + finalDistance * rate.price_per_km;

    // Ajouter le coût des options
    if (Array.isArray(ride.options)) {
      const validOptions = ['child_seat', 'pet_friendly'];
      const validOptionsInPayload = ride.options.filter((opt: string) => validOptions.includes(opt));
      
      if (validOptionsInPayload.length > 0) {
        const optionsPrice = validOptionsInPayload.reduce((sum: number, opt: string) => {
          switch(opt) {
            case 'child_seat': return sum + 15;
            case 'pet_friendly': return sum + 10;
            default: return sum;
          }
        }, 0);
        
        totalPrice += optionsPrice;
        
        console.log('[DEBUG] Options added:', {
          options: validOptionsInPayload,
          additionalCost: optionsPrice
        });
      }
    }

    // Appliquer le prix minimum
    totalPrice = Math.max(totalPrice, rate.min_price);

    console.log('[DEBUG] Final price calculated:', {
      basePrice: rate.base_price,
      distance: finalDistance,
      pricePerKm: rate.price_per_km,
      options: ride.options,
      minPrice: rate.min_price,
      totalPrice: totalPrice,
      routeSource: routeSource
    });

    // Préparer les données de mise à jour
    const updateData: RideUpdateData = {
      final_price: totalPrice,
      estimated_price: totalPrice,
      distance: finalDistance,
      duration: calculatedDuration
    };

    // Auditer l'opération
    await logAudit(supabaseClient, {
      event_type: 'price_calculation_with_osm',
      service: 'price_calculator_osm',
      ride_id: ride.id,
      calculated_price: totalPrice,
      metadata: {
        base_price: rate.base_price,
        distance: finalDistance,
        duration: calculatedDuration,
        price_per_km: rate.price_per_km,
        options: ride.options,
        route_source: routeSource,
        vehicle_type: ride.vehicle_type
      }
    });

    // Mettre à jour la course
    const { error: updateError } = await supabaseClient
      .from('rides')
      .update(updateData)
      .eq('id', ride.id);

    if (updateError) {
      console.error('Error updating ride', {
        error: updateError,
        rideId: ride.id,
        updateData: updateData
      });
      
      await logAudit(supabaseClient, {
        event_type: 'price_calculation_error',
        service: 'price_calculator_osm',
        ride_id: ride.id,
        calculated_price: totalPrice,
        metadata: {
          error: 'Erreur lors de la mise à jour de la course',
          details: updateError
        }
      });
      
      return new Response(JSON.stringify({
        error: 'Erreur lors de la mise à jour de la course',
        details: updateError,
        rideId: ride.id,
        calculatedPrice: totalPrice
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        }
      });
    }

    console.log('[DEBUG] Ride updated successfully', {
      rideId: ride.id,
      price: totalPrice,
      distance: finalDistance,
      duration: calculatedDuration
    });

    // Réponse de succès
    return new Response(JSON.stringify({
      success: true,
      price: totalPrice,
      breakdown: {
        base: rate.base_price,
        distance: finalDistance,
        duration: calculatedDuration,
        pricePerKm: rate.price_per_km,
        minPrice: rate.min_price,
        options: Array.isArray(ride.options) ? ride.options : [],
        totalPrice,
        routeSource
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
      }
    });

  } catch (error) {
    console.error('Unexpected error in price-calculator-with-osm', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
      }
    });
  }
});
