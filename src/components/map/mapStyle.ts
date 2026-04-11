import type { StyleSpecification } from "maplibre-gl";

const mapStyle: StyleSpecification = {
  version: 8,
  // Utilisation des polices système pour un rendu plus net
  glyphs: "https://tiles.stadiamaps.com/fonts/{fontstack}/{range}.pbf",
  sources: {
    stadia: {
      type: "vector",
      url: "https://tiles.stadiamaps.com/data/openmaptiles.json",
    },
  },
  layers: [
    // --- FOND DE CARTE ---
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#f8f9fa" },
    },
    {
      id: "water",
      type: "fill",
      source: "stadia",
      "source-layer": "water",
      paint: { "fill-color": "#aadaff" },
    },
    {
      id: "park",
      type: "fill",
      source: "stadia",
      "source-layer": "landcover",
      filter: ["in", "class", "park", "forest", "grass"],
      paint: { "fill-color": "#d0e9bc" }, // Vert plus "nature" comme sur la capture
    },

    // --- BORDURES DES ROUTES (OUTLINES) ---
    // On crée des bordures fines pour détacher les routes du fond
    {
      id: "road-outline",
      type: "line",
      source: "stadia",
      "source-layer": "transportation",
      paint: {
        "line-color": "#d1d5db",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0, 14, 1],
        "line-opacity": 0.4,
      },
    },

    // --- AXES ROUTIERS (COULEURS CAPTURE) ---
    {
      id: "road-motorway",
      type: "line",
      source: "stadia",
      "source-layer": "transportation",
      filter: ["==", "class", "motorway"],
      paint: {
        "line-color": "#ffc473", // Orange OSM
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 14, 8],
      },
    },
    {
      id: "road-primary",
      type: "line",
      source: "stadia",
      "source-layer": "transportation",
      filter: ["==", "class", "primary"],
      paint: {
        "line-color": "#fff2af", // Jaune OSM
        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1, 14, 6],
      },
    },
    {
      id: "road-secondary-tertiary",
      type: "line",
      source: "stadia",
      "source-layer": "transportation",
      filter: ["in", "class", "secondary", "tertiary"],
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 14, 4],
      },
    },
    {
      id: "road-residential",
      type: "line",
      source: "stadia",
      "source-layer": "transportation",
      filter: ["in", "class", "residential", "service", "unclassified"],
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.5, 16, 3],
      },
    },

    // --- LABELS ET TEXTES ---
    {
      id: "road-labels",
      type: "symbol",
      source: "stadia",
      "source-layer": "transportation_name",
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "symbol-placement": "line",
      },
      paint: {
        "text-color": "#6b7280",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
    {
      id: "label-city",
      type: "symbol",
      source: "stadia",
      "source-layer": "place",
      filter: ["==", "class", "city"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 5, 10, 10, 16],
      },
      paint: {
        "text-color": "#1f2937",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
  ],
};

export default mapStyle;
