import maplibregl from "maplibre-gl";
import type { MapMode } from "../UnifiedMap";
import { colors } from "@/styles/design-tokens";

const { map: m } = colors;

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
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 3,
          "line-color": m.routeAlt,
          "line-opacity": 0.55,
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
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 10,
          "line-color": m.routeGlow,
          "line-blur": 6,
          "line-opacity": 0.35,
        },
      });
    }

    // Casing under main route for contrast against soft basemap roads
    if (!mapInstance.getLayer("line-main-casing")) {
      mapInstance.addLayer({
        id: "line-main-casing",
        type: "line",
        source: "route-main",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 6,
          "line-color":
            modeLocal === "REQUEST" ? m.routeCasing : "#1d4ed8",
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
          "line-color": modeLocal === "REQUEST" ? m.route : "#3b82f6",
          "line-opacity": 1,
        },
      });
    }
  } catch (e) {
    console.warn("[map-helpers] ensureSourcesAndLayers error", e);
  }
}
