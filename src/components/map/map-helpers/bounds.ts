import maplibregl from "maplibre-gl";

type LngLat = [number, number];

/** Short map cards (e.g. confirmation mobile h-48) need extra inset for A/B pin markers. */
const COMPACT_MAP_MAX_HEIGHT_PX = 220;

function isCompactMapContainer(container: HTMLElement | null | undefined): boolean {
  const h = container?.clientHeight ?? 0;
  return h > 0 && h < COMPACT_MAP_MAX_HEIGHT_PX;
}

/** Padding scaled to the map container — room for pin markers inside small cards. */
export function mapFitPadding(container: HTMLElement | null | undefined) {
  const w = container?.clientWidth ?? 400;
  const h = container?.clientHeight ?? 240;

  if (isCompactMapContainer(container)) {
    return {
      top: Math.max(44, Math.round(h * 0.22)),
      bottom: Math.max(44, Math.round(h * 0.22)),
      left: Math.max(40, Math.round(w * 0.14)),
      right: Math.max(40, Math.round(w * 0.14)),
    };
  }

  const padX = Math.max(32, Math.round(w * 0.12));
  const padY = Math.max(36, Math.round(h * 0.16));
  return { top: padY, bottom: padY, left: padX, right: padX };
}

export function boundsFromLngLats(coords: LngLat[]): maplibregl.LngLatBounds | null {
  if (coords.length === 0) return null;
  return coords.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(coords[0], coords[0]),
  );
}

export function fitMapToBounds(
  map: maplibregl.Map,
  bounds: maplibregl.LngLatBounds,
  options?: { animate?: boolean; maxZoom?: number },
) {
  const container = map.getContainer();
  const compact = isCompactMapContainer(container);

  map.resize();
  requestAnimationFrame(() => {
    map.fitBounds(bounds, {
      padding: mapFitPadding(container),
      animate: options?.animate ?? false,
      maxZoom: options?.maxZoom ?? (compact ? 10 : 11),
      duration: options?.animate ? 300 : 0,
    });
  });
}
