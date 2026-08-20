import maplibregl from "maplibre-gl";

export type IconLike = (props: any) => any;

function pinSvg(color: string, label: string): string {
  return `
<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M14 1C7.373 1 2 6.373 2 13c0 8.25 10.2 20.4 11.2 21.55a1.2 1.2 0 0 0 1.6 0C15.8 33.4 26 21.25 26 13 26 6.373 20.627 1 14 1z"
    fill="${color}" stroke="#ffffff" stroke-width="2"/>
  <text x="14" y="16.5" text-anchor="middle" font-size="11" font-weight="700"
    font-family="system-ui,-apple-system,sans-serif" fill="#ffffff">${label}</text>
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
    "width:28px;height:36px;line-height:0;filter:drop-shadow(0 2px 4px rgba(15,23,42,0.45));pointer-events:none;";

  if (id === "driver") {
    el.style.width = "28px";
    el.style.height = "28px";
    el.style.transform = `rotate(${heading || 0}deg)`;
    el.innerHTML = driverSvg(color);
    return el;
  }

  const label = id === "pickup" ? "A" : "B";
  el.innerHTML = pinSvg(color, label);
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

    // Drop any leftover React root for this id (legacy path)
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
    const marker = new maplibregl.Marker({
      element: el,
      anchor: id === "driver" ? "center" : "bottom",
    })
      .setLngLat([loc.lng, loc.lat])
      .addTo(mapInstance);

    markers.set(id, marker);
  } catch (e) {
    console.warn("[map-helpers] syncMarker error", e);
  }
}
