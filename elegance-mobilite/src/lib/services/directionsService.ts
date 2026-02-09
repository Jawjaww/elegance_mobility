/**
 * Service client pour récupérer les directions entre deux points
 * Remplace l'API route /api/directions (incompatible avec output: export)
 */

export interface DirectionsParams {
  start: { lng: number; lat: number };
  end: { lng: number; lat: number };
}

export interface RouteGeometry {
  type: string;
  coordinates: number[][];
}

export interface RouteSummary {
  distance: number;
  duration: number;
}

export interface DirectionsResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: RouteGeometry;
    properties: {
      summary: RouteSummary;
    };
  }>;
}

/**
 * Récupère l'itinéraire entre deux points via OSRM
 * @param params Coordonnées de départ et d'arrivée
 * @returns GeoJSON avec la géométrie de l'itinéraire
 */
export async function getDirections(
  params: DirectionsParams,
): Promise<DirectionsResponse> {
  const { start, end } = params;

  // Validation des coordonnées
  if (!start?.lng || !start?.lat || !end?.lng || !end?.lat) {
    throw new Error("Coordonnées invalides");
  }

  // URL de l'API OSRM (routing.openstreetmap.de)
  const osrmUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const response = await fetch(osrmUrl);

  if (!response.ok) {
    throw new Error(`OSRM API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("Aucun itinéraire trouvé");
  }

  // Transforme la réponse OSRM en format GeoJSON
  const route = data.routes[0];
  const geojson: DirectionsResponse = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: route.geometry,
        properties: {
          summary: {
            distance: route.distance,
            duration: route.duration,
          },
        },
      },
    ],
  };

  return geojson;
}

/**
 * Variante pour compatibilité avec l'ancien format (query string)
 * @param startStr "lng,lat"
 * @param endStr "lng,lat"
 */
export async function getDirectionsFromString(
  startStr: string,
  endStr: string,
): Promise<DirectionsResponse> {
  const [startLng, startLat] = startStr.split(",").map(Number);
  const [endLng, endLat] = endStr.split(",").map(Number);

  return getDirections({
    start: { lng: startLng, lat: startLat },
    end: { lng: endLng, lat: endLat },
  });
}
