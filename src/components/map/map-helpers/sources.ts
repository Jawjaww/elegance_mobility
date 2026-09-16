import maplibregl from "maplibre-gl";
import { readMapPalette } from "./mapPalette";

export function ensureSourcesAndLayers(mapInstance: maplibregl.Map) {
  const palette = readMapPalette();

  try {
    if (!mapInstance.getSource("route-main"))
      mapInstance.addSource("route-main", {
        type: "geojson",
        lineMetrics: true,
        data: { type: "FeatureCollection", features: [] },
      });

    // Neon rim hugging the route — same subtle halo treatment as the markers.
    // Drawn first so it sits under the casing and the line.
    if (!mapInstance.getLayer("line-glow")) {
      mapInstance.addLayer({
        id: "line-glow",
        type: "line",
        source: "route-main",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 11,
          "line-color": palette.routeGlow,
          "line-blur": palette.neonBlurPx,
        },
      });
    }

    // Casing under the main route for contrast against soft basemap roads
    if (!mapInstance.getLayer("line-main-casing")) {
      mapInstance.addLayer({
        id: "line-main-casing",
        type: "line",
        source: "route-main",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 6,
          "line-color": palette.routeEdge,
          "line-opacity": 0.9,
        },
      });
    }

    if (!mapInstance.getLayer("line-main")) {
      mapInstance.addLayer({
        id: "line-main",
        type: "line",
        source: "route-main",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 3.5,
          "line-color": palette.route,
          "line-opacity": 1,
        },
      });
    }
  } catch (e) {
    console.warn("[map-helpers] ensureSourcesAndLayers error", e);
  }
}
