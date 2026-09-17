/**
 * Resolves the map palette declared as `--ve-map-*` custom properties in
 * `src/app/globals.css` — the single place to edit map colours.
 *
 * Inline SVG markers and the reservation rail read those variables directly
 * (`var()` resolves in the DOM). MapLibre paint properties are WebGL and cannot
 * resolve CSS custom properties, so the layers that need them go through this
 * reader.
 *
 * Every read falls back to the palette default: a missing stylesheet degrades
 * to the right colours instead of an invisible layer.
 */
export type MapPalette = {
  departure: string;
  arrival: string;
  driver: string;
  driverRing: string;
  route: string;
  routeEdge: string;
  routeGlow: string;
  approach: string;
  approachGlow: string;
  /** Blur radius (px) of the neon rim, resolved from `--ve-map-neon-blur`. */
  neonBlurPx: number;
};

const FALLBACKS: MapPalette = {
  departure: "#3b82f6",
  arrival: "#10b981",
  driver: "#3b82f6",
  driverRing: "#ffffff",
  route: "#3b82f6",
  routeEdge: "#1d4ed8",
  routeGlow: "rgba(59, 130, 246, 0.32)",
  approach: "#f97316",
  approachGlow: "rgba(249, 115, 22, 0.35)",
  neonBlurPx: 3,
};

function readVar(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || null;
}

export function readMapPalette(): MapPalette {
  const blur = readVar("--ve-map-neon-blur");
  const parsedBlur = blur ? Number.parseFloat(blur) : Number.NaN;

  return {
    departure: readVar("--ve-map-departure") ?? FALLBACKS.departure,
    arrival: readVar("--ve-map-arrival") ?? FALLBACKS.arrival,
    driver: readVar("--ve-map-driver") ?? FALLBACKS.driver,
    driverRing: readVar("--ve-map-driver-ring") ?? FALLBACKS.driverRing,
    route: readVar("--ve-map-route") ?? FALLBACKS.route,
    routeEdge: readVar("--ve-map-route-edge") ?? FALLBACKS.routeEdge,
    routeGlow: readVar("--ve-map-route-glow") ?? FALLBACKS.routeGlow,
    approach: readVar("--ve-map-approach") ?? FALLBACKS.approach,
    approachGlow: readVar("--ve-map-approach-glow") ?? FALLBACKS.approachGlow,
    neonBlurPx: Number.isFinite(parsedBlur)
      ? parsedBlur
      : FALLBACKS.neonBlurPx,
  };
}
