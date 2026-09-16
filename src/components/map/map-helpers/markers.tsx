import maplibregl from "maplibre-gl";

/**
 * Marker colours come from the `--ve-map-*` custom properties declared in
 * `src/app/globals.css` (single source of truth). Inline SVG resolves them
 * directly, so no JS round-trip is needed here.
 *
 * Every marker shares the same treatment: a contrasted `*-edge` outline plus a
 * subtle neon rim (`*-glow`, same blur as the route halo).
 */

/** Soft drop shadow that keeps the marker readable over a busy basemap. */
const MARKER_SHADOW = "drop-shadow(0 2px 4px rgba(15, 23, 42, 0.45))";

/**
 * Departure glyph — a navigation arrow pointing **straight up**, so a rotation
 * equal to the compass bearing points it at the arrival. A tilted base glyph
 * would need a magic angular offset for every call site.
 *
 * The viewBox is padded so the contrasted outline is not clipped.
 */
const DEPARTURE_SVG = `
<svg width="28" height="28" viewBox="-1 -1 26 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <polygon points="12 1.5 21 21 12 15.5 3 21"
    style="fill: var(--ve-map-departure); stroke: var(--ve-map-departure-edge); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round"/>
</svg>`.trim();

/** Arrival flag — the pole base marks the dropoff point (anchor `bottom-left`). */
const ARRIVAL_SVG = `
<svg width="31" height="40" viewBox="0 0 31 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M4.5 4v34" style="stroke: var(--ve-map-arrival-edge); stroke-width: 3.4; stroke-linecap: round"/>
  <path d="M6.1 5h21.4l-5.2 8 5.2 8H6.1z"
    style="fill: var(--ve-map-arrival); stroke: var(--ve-map-arrival-edge); stroke-width: 1.2; stroke-linejoin: round"/>
  <circle cx="4.5" cy="4" r="2.5" style="fill: var(--ve-map-arrival-edge)"/>
</svg>`.trim();

/** Driver puck — up-pointing arrow inside a disc; rotated by its heading. */
const DRIVER_SVG = `
<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="14" cy="14" r="12" style="fill: var(--ve-map-driver); stroke: var(--ve-map-driver-edge); stroke-width: 2"/>
  <path d="M14 6l6 14-6-3.2L8 20z" fill="#ffffff"/>
</svg>`.trim();

type MarkerShape = {
  markup: string;
  /** Custom property holding the neon rim colour for this marker. */
  glow: string;
  width: number;
  height: number;
  /** Glyphs drawn pointing up can take a compass rotation (bearing). */
  orientable: boolean;
};

function shapeFor(id: string): MarkerShape {
  if (id === "pickup") {
    return {
      markup: DEPARTURE_SVG,
      glow: "--ve-map-departure-glow",
      width: 28,
      height: 28,
      orientable: true,
    };
  }
  if (id === "dropoff") {
    return {
      markup: ARRIVAL_SVG,
      glow: "--ve-map-arrival-glow",
      width: 31,
      height: 40,
      orientable: false,
    };
  }
  return {
    markup: DRIVER_SVG,
    glow: "--ve-map-driver-glow",
    width: 28,
    height: 28,
    orientable: true,
  };
}

/** Only a finite compass bearing is worth a rotation. */
function asRotation(heading?: number): number | undefined {
  return heading !== undefined && Number.isFinite(heading) ? heading : undefined;
}

function buildMarkerElement(id: string): HTMLDivElement {
  const { markup, glow, width, height } = shapeFor(id);

  const el = document.createElement("div");
  el.style.cssText = [
    "line-height:0",
    "pointer-events:none",
    `width:${width}px`,
    `height:${height}px`,
    `filter:${MARKER_SHADOW} drop-shadow(0 0 var(--ve-map-neon-blur) var(${glow}))`,
  ].join(";");
  el.innerHTML = markup;

  return el;
}

export function syncMarker(
  mapInstance: maplibregl.Map,
  id: string,
  loc: { lat: number; lng: number; heading?: number },
  markers: Map<string, maplibregl.Marker>,
  roots: Map<string, { unmount: () => void }>,
) {
  try {
    const { orientable } = shapeFor(id);
    const rotation = orientable ? asRotation(loc.heading) : undefined;

    const existing = markers.get(id);
    if (existing) {
      existing.setLngLat([loc.lng, loc.lat]);
      // MapLibre owns the element `transform` (it rewrites it on every pan),
      // so the rotation must go through the Marker API — writing
      // `node.style.transform` ourselves would be silently overwritten.
      if (rotation !== undefined) existing.setRotation(rotation);
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

    // Only the arrival flag uses an off-centre anchor (its pole base marks the
    // coordinate); every other glyph is centred.
    const anchor: maplibregl.MarkerOptions["anchor"] =
      id === "dropoff" ? "bottom-left" : "center";
    // Heading is a compass bearing → map plane, while the glyph stays flat on
    // screen (`pitchAlignment`) so a tilted camera does not squash it. The flag
    // keeps the library defaults.
    const orientation: maplibregl.MarkerOptions = orientable
      ? {
          rotation,
          rotationAlignment: "map",
          pitchAlignment: "viewport",
        }
      : {};
    const marker = new maplibregl.Marker({
      element: buildMarkerElement(id),
      anchor,
      ...orientation,
    })
      .setLngLat([loc.lng, loc.lat])
      .addTo(mapInstance);

    markers.set(id, marker);
  } catch (e) {
    console.warn("[map-helpers] syncMarker error", e);
  }
}
