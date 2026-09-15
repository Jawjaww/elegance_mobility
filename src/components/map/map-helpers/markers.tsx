import maplibregl from "maplibre-gl";

export const MAP_PICKUP_COLOR = "#3b82f6";
export const MAP_DROPOFF_COLOR = "#10b981";

export type IconLike = (props: any) => any;

/** MapPin-style marker — matches TripEndpointRail departure icon. */
function mapPinSvg(color: string): string {
  return `
<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M14 1C7.373 1 2 6.373 2 13c0 8.25 10.2 20.4 11.2 21.55a1.2 1.2 0 0 0 1.6 0C15.8 33.4 26 21.25 26 13 26 6.373 20.627 1 14 1z"
    fill="${color}" stroke="#ffffff" stroke-width="2"/>
  <circle cx="14" cy="13" r="4.5" fill="#ffffff"/>
  <circle cx="14" cy="13" r="2.2" fill="${color}"/>
</svg>`.trim();
}

/** LandPlot-style marker — matches TripEndpointRail arrival icon. */
function landPlotSvg(color: string): string {
  return `
<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="5" y="5" width="18" height="18" rx="2.5" fill="${color}" stroke="#ffffff" stroke-width="2"/>
  <path d="M5 14h18M14 5v18" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
</svg>`.trim();
}

function driverSvg(color: string): string {
  return `
<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="14" cy="14" r="12" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
  <path d="M14 6l6 14-6-3.2L8 20z" fill="#ffffff"/>
</svg>`.trim();
}

function buildMarkerElement(
  id: string,
  color: string,
  heading?: number,
): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "line-height:0;filter:drop-shadow(0 2px 4px rgba(15,23,42,0.45));pointer-events:none;";

  if (id === "driver") {
    el.style.width = "28px";
    el.style.height = "28px";
    el.style.transform = `rotate(${heading || 0}deg)`;
    el.innerHTML = driverSvg(color);
    return el;
  }

  if (id === "pickup") {
    el.style.width = "28px";
    el.style.height = "36px";
    el.innerHTML = mapPinSvg(color);
    return el;
  }

  el.style.width = "28px";
  el.style.height = "28px";
  el.innerHTML = landPlotSvg(color);
  return el;
}

export function syncMarker(
  mapInstance: maplibregl.Map,
  id: string,
  loc: { lat: number; lng: number; heading?: number },
  _Icon: unknown,
  color: string,
  markers: Map<string, maplibregl.Marker>,
  roots: Map<string, { unmount: () => void }>,
) {
  try {
    const existing = markers.get(id);
    if (existing) {
      existing.setLngLat([loc.lng, loc.lat]);
      if (id === "driver") {
        const node = existing.getElement();
        if (node) node.style.transform = `rotate(${loc.heading || 0}deg)`;
      }
      return;
    }

    const oldRoot = roots.get(id);
    if (oldRoot) {
      try {
        oldRoot.unmount();
      } catch {
        /* ignore */
      }
      roots.delete(id);
    }

    const el = buildMarkerElement(id, color, loc.heading);
    let anchor: maplibregl.MarkerOptions["anchor"] = "center";
    if (id === "pickup") anchor = "bottom";
    const marker = new maplibregl.Marker({
      element: el,
      anchor,
    })
      .setLngLat([loc.lng, loc.lat])
      .addTo(mapInstance);

    markers.set(id, marker);
  } catch (e) {
    console.warn("[map-helpers] syncMarker error", e);
  }
}
