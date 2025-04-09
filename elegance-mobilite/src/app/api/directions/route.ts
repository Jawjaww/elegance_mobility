import { NextResponse } from 'next/server';

/**
 * Route API pour récupérer les directions entre deux points
 * @param request Request contenant les coordonnées start et end
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Missing start or end coordinates' },
        { status: 400 }
      );
    }

    // URL de l'API OSRM
    const osrmUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

    const response = await fetch(osrmUrl);
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: 'No route found' },
        { status: 404 }
      );
    }

    // Transforme la réponse OSRM en format GeoJSON
    const route = data.routes[0];
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: route.geometry,
          properties: {
            summary: {
              distance: route.distance,
              duration: route.duration
            }
          }
        }
      ]
    };

    return NextResponse.json(geojson);

  } catch (error) {
    console.error('[API] Direction error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 }
    );
  }
}