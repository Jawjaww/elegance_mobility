/**
 * Client-side directions service (Tauri / static export friendly)
 * Fetches a route from an OSRM-compatible routing endpoint and returns GeoJSON.
 */
export async function getDirections(start: string, end: string) {
  if (!start || !end) throw new Error("Missing start or end coordinates");

  const osrmUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
  const res = await fetch(osrmUrl);
  if (!res.ok) throw new Error(`Routing API error: ${res.status}`);
  const data = await res.json();
  if (!data.routes || data.routes.length === 0)
    throw new Error("No route found");

  const route = data.routes[0];
  const geojson = {
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

export default { getDirections };
