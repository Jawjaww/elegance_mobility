import { NextResponse } from 'next/server';

const API_KEY = "5b3ce3597851110001cf6248a60eaa2995af4567b371cc68cd3affad";
const BASE_URL = "https://api.openrouteservice.org/v2/directions";

export async function GET(request: Request) {
  // Récupérer les paramètres de la requête
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const profile = searchParams.get('profile') || 'driving-car';

  console.log("API route appelée avec:", { start, end, profile });

  // Vérifier que les paramètres nécessaires sont présents
  if (!start || !end) {
    return NextResponse.json(
      { error: 'Les paramètres start et end sont requis' },
      { status: 400 }
    );
  }

  try {
    // Construire l'URL pour OpenRouteService
    const url = `${BASE_URL}/${profile}?api_key=${API_KEY}&start=${start}&end=${end}`;
    
    // Faire la demande au service externe avec authorization header
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      method: 'GET',
      cache: 'no-store'
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      console.error(`Erreur OpenRouteService: ${response.status}`, await response.text());
      
      // Si OpenRouteService échoue, essayer OSRM comme fallback
      return await getFallbackRouting(start, end, profile);
    }

    // Renvoyer les données au client
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'itinéraire:', error);
    return await getFallbackRouting(start, end, profile);
  }
}

// Service de routage alternatif si OpenRouteService échoue
async function getFallbackRouting(start: string, end: string, profile = 'driving-car') {
  try {
    // Convertir le profil OpenRouteService au format OSRM
    const osrmProfile = profile === 'driving-car' ? 'car' : 
                        profile === 'cycling-regular' ? 'bike' : 
                        'foot';
    
    // Format OSRM: longitude,latitude pour chaque point
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${start};${end}?overview=full&geometries=geojson`;
    
    console.log("Tentative avec OSRM:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM a retourné ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transformer la réponse OSRM au format OpenRouteService
    // pour que le client puisse la traiter de la même façon
    return NextResponse.json({
      features: [{
        geometry: {
          coordinates: data.routes[0].geometry.coordinates,
          type: "LineString"
        },
        properties: {
          summary: {
            distance: data.routes[0].distance,
            duration: data.routes[0].duration
          }
        }
      }]
    });
    
  } catch (error) {
    console.error('Erreur avec le service de routage alternatif:', error);
    return NextResponse.json(
      { error: 'Impossible de calculer l\'itinéraire' },
      { status: 500 }
    );
  }
}
