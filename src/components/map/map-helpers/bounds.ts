import maplibregl from "maplibre-gl";

type LngLat = [number, number];

/** Padding scaled to the map container — room for pin markers inside small cards. */
export function mapFitPadding(container: HTMLElement | null | undefined) {
  const w = container?.clientWidth ?? 400;
  const h = container?.clientHeight ?? 240;
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
  map.resize();
  requestAnimationFrame(() => {
    map.fitBounds(bounds, {
      padding: mapFitPadding(map.getContainer()),
      animate: options?.animate ?? false,
      maxZoom: options?.maxZoom ?? 11,
      duration: options?.animate ? 300 : 0,
    });
  });
}
