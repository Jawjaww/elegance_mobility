import maplibregl from "maplibre-gl";
import type { MapMode } from "../UnifiedMap";

export function ensureSourcesAndLayers(
  mapInstance: maplibregl.Map,
  modeLocal: MapMode,
) {
  try {
    if (!mapInstance.getSource("route-main"))
      mapInstance.addSource("route-main", {
        type: "geojson",
        lineMetrics: true,
        data: { type: "FeatureCollection", features: [] },
      });
    if (!mapInstance.getSource("route-alt"))
      mapInstance.addSource("route-alt", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

    if (!mapInstance.getLayer("line-alt")) {
      mapInstance.addLayer({
        id: "line-alt",
        type: "line",
        source: "route-alt",
        paint: {
          "line-width": 3,
          "line-color": "#94a3b8",
          "line-opacity": 0.5,
          "line-dasharray": [2, 2],
          "line-offset": modeLocal === "REQUEST" ? 3 : 0,
        },
      });
    }

    if (modeLocal === "REQUEST" && !mapInstance.getLayer("line-glow")) {
      mapInstance.addLayer({
        id: "line-glow",
        type: "line",
        source: "route-main",
        paint: {
          // reduced thickness (user requested thinner) and softer glow color
          "line-width": 9,
          "line-color": "#ffc38f",
          "line-blur": 8,
          "line-opacity": 0.2,
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
          // significantly thinner main line for clear separation from glow
          "line-width": 3,
          "line-color": modeLocal === "REQUEST" ? "#fda456" : "#3b82f6",
        },
      });
    }
  } catch (e) {
    console.warn("[map-helpers] ensureSourcesAndLayers error", e);
  }
}
