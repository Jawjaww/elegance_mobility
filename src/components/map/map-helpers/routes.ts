import maplibregl from "maplibre-gl";
import {
  getDirections,
  type DirectionsResponse,
} from "@/lib/services/directionsService";
import {
  boundsFromLngLats,
  computeFitSpanKm,
  fitMapToBounds,
} from "@/components/map/map-helpers/bounds";

function readRouteMetrics(
  feature: DirectionsResponse["features"][number],
): { distance: number; duration: number } | null {
  const { distance, duration } = feature.properties.summary;
  if (typeof distance === "number" && typeof duration === "number") {
    return { distance, duration };
  }
  return null;
}

function fitMapToRoute(
  mapInstance: maplibregl.Map,
  coords: [number, number][],
  p: { lat: number; lng: number },
  d: { lat: number; lng: number },
) {
  const bounds = boundsFromLngLats(coords);
  if (!bounds) return;
  const spanKm = computeFitSpanKm([
    { lat: p.lat, lng: p.lng },
    { lat: d.lat, lng: d.lng },
  ]);
  fitMapToBounds(mapInstance, bounds, { spanKm });
}

function applyMainRoute(
  mapInstance: maplibregl.Map,
  main: DirectionsResponse,
  p: { lat: number; lng: number },
  d: { lat: number; lng: number },
) {
  const feature = main.features?.[0];
  if (!feature) return;

  const source = mapInstance.getSource("route-main") as
    | maplibregl.GeoJSONSource
    | undefined;
  source?.setData(main as GeoJSON.GeoJSON);

  const rawCoords = feature.geometry?.coordinates;
  if (!rawCoords || rawCoords.length < 2) return;
  const coords = rawCoords as [number, number][];
  fitMapToRoute(mapInstance, coords, p, d);
}

export async function fetchAndSetRoutes(
  mapInstance: maplibregl.Map,
  p: { lat: number; lng: number },
  d: { lat: number; lng: number },
  _controller: AbortController,
  onRouteCalculatedLocal?: (distance: number, duration: number) => void,
) {
  let main: DirectionsResponse | null = null;
  try {
    main = await getDirections({
      start: { lng: p.lng, lat: p.lat },
      end: { lng: d.lng, lat: d.lat },
    });
  } catch (err) {
    console.warn("[map-helpers/routes] getDirections error", err);
  }

  if (!main?.features?.[0]) return;
  const feature = main.features[0];

  try {
    applyMainRoute(mapInstance, main, p, d);
    const metrics = readRouteMetrics(feature);
    if (metrics) {
      onRouteCalculatedLocal?.(metrics.distance, metrics.duration);
    }
  } catch (err) {
    console.warn("[map-helpers/routes] apply route failed", err);
  }
}
