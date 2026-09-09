import maplibregl from "maplibre-gl";
import { getDirections } from "@/lib/services/directionsService";
import { boundsFromLngLats, fitMapToBounds } from "@/components/map/map-helpers/bounds";

export async function fetchAndSetRoutes(
  mapInstance: maplibregl.Map,
  p: { lat: number; lng: number },
  d: { lat: number; lng: number },
  controller: AbortController,
  onRouteCalculatedLocal?: (distance: number, duration: number) => void,
) {
  try {
    let main: any = null;
    let alt: any = null;

    try {
      // Direct client-side directions (CSR / Tauri-ready)
      main = await getDirections({
        start: { lng: p.lng, lat: p.lat },
        end: { lng: d.lng, lat: d.lat },
      });
    } catch (err) {
      console.warn("[map-helpers/routes] getDirections error", err);
      main = null;
    }

    try {
      if (main && main.features && main.features[0]) {
        (mapInstance.getSource("route-main") as any).setData(main);
        const coords = main.features[0].geometry?.coordinates as
          | [number, number][]
          | undefined;
        if (coords && coords.length > 1) {
          const bounds = boundsFromLngLats(coords);
          if (bounds) fitMapToBounds(mapInstance, bounds);
        }
        try {
          const route = main.features[0];
          const distance =
            route.properties?.summary?.distance ??
            route.properties?.distance ??
            null;
          const duration =
            route.properties?.summary?.duration ??
            route.properties?.duration ??
            null;
          if (typeof distance === "number" && typeof duration === "number") {
            onRouteCalculatedLocal?.(distance, duration);
          }
        } catch (e) {}
      }
    } catch (e) {}

    try {
      if (alt && alt.features && alt.features[0])
        (mapInstance.getSource("route-alt") as any).setData(alt);
    } catch (e) {}
  } catch (e) {
    // top-level fetch error
  }
}
