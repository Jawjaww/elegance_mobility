import maplibregl from 'maplibre-gl';

export async function fetchAndSetRoutes(
  mapInstance: maplibregl.Map,
  p: { lat: number; lng: number },
  d: { lat: number; lng: number },
  controller: AbortController,
  onRouteCalculatedLocal?: (distance: number, duration: number) => void,
) {
  try {
    const url = (s: any, e: any) =>
      `/api/directions?start=${s.lng},${s.lat}&end=${e.lng},${e.lat}`;
    let main: any = null;
    let alt: any = null;

    try {
      const res = await fetch(url(p, d), { signal: controller.signal });
      main = await res.json();
    } catch (err) {
      main = null;
    }

    try {
      // placeholder for alt route fetching
      alt = null;
    } catch (err) {
      alt = null;
    }

    try {
      if (main && main.features && main.features[0]) (mapInstance.getSource('route-main') as any).setData(main);
    } catch (e) {}

    try {
      if (main && main.features && main.features[0]) {
        (mapInstance.getSource('route-main') as any).setData(main);
        try {
          const route = main.features[0];
          const distance = route.properties?.summary?.distance ?? route.properties?.distance ?? null;
          const duration = route.properties?.summary?.duration ?? route.properties?.duration ?? null;
          if (typeof distance === 'number' && typeof duration === 'number') {
            onRouteCalculatedLocal?.(distance, duration);
          }
        } catch (e) {}
      }
    } catch (e) {}

    try {
      if (alt && alt.features && alt.features[0]) (mapInstance.getSource('route-alt') as any).setData(alt);
    } catch (e) {}
  } catch (e) {
    // top-level fetch error
  }
}
