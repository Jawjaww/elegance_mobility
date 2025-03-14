import { NextResponse } from 'next/server';

// Utiliser OSRM qui est gratuit et ne nécessite pas de clé API
export async function GET(request: Request) {
  // Récupérer les paramètres de la requête
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const profile = searchParams.get('profile') || 'car'; // car, bike, foot

  console.log("[API] directions appelée:", { start, end, profile });

  // Vérifier que les paramètres nécessaires sont présents et valides
  if (!start || !end) {
    return NextResponse.json(
      { error: 'Les paramètres start et end sont requis' },
      { status: 400 }
    );
  }

  // Valider le format des coordonnées
  const coordsRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
  
  if (!coordsRegex.test(start) || !coordsRegex.test(end)) {
    return NextResponse.json(
      { error: 'Format de coordonnées invalide. Format attendu: longitude,latitude' },
      { status: 400 }
    );
  }

  // Vérifier que les valeurs sont dans des plages valides
  try {
    const [startLon, startLat] = start.split(',').map(Number);
    const [endLon, endLat] = end.split(',').map(Number);

    if (
      isNaN(startLon) || isNaN(startLat) || 
      isNaN(endLon) || isNaN(endLat) ||
      startLat < -90 || startLat > 90 ||
      endLat < -90 || endLat > 90 ||
      startLon < -180 || startLon > 180 ||
      endLon < -180 || endLon > 180
    ) {
      return NextResponse.json(
        { error: 'Coordonnées hors limites valides' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la validation des coordonnées' },
      { status: 400 }
    );
  }

  try {
    // OSRM est un service gratuit et libre
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start};${end}?overview=full&geometries=geojson`;
    
    console.log("[API] Appel OSRM:", url);
    
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`[API] Erreur OSRM: ${response.status}`);
      throw new Error(`Erreur OSRM: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error("[API] Aucun itinéraire trouvé");
      throw new Error('Aucun itinéraire trouvé');
    }
    
    // Transformation au format attendu par le client
    const transformedData = {
      features: [{
        geometry: data.routes[0].geometry,
        properties: {
          summary: {
            distance: data.routes[0].distance,
            duration: data.routes[0].duration
          }
        }
      }]
    };
    
    console.log("[API] Itinéraire trouvé:", { 
      distance: Math.round(data.routes[0].distance/1000) + "km",
      duration: Math.round(data.routes[0].duration/60) + "min"
    });
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('[API] Erreur lors de la récupération de l\'itinéraire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'itinéraire', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
