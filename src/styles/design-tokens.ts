// Design tokens centralisés pour le kit UI
export const colors = {
  neon: {
    green: "#05c46b",
    greenLight: "#9efbd1",
    greenBright: "#10ff8c",
  },
  glass: {
    alphaLight: "rgba(255,255,255,0.02)",
    alphaMedium: "rgba(255,255,255,0.06)",
    alphaHeavy: "rgba(255,255,255,0.12)",
  },
  bordeaux: {
    base: "#7c2230",
    icon: "#a0303a",
  },
  /** Modern basemap: fill lighter than casing; major axes more contrasted. */
  map: {
    background: "#ebe7df",
    water: "#9ec9e8",
    waterway: "#7eb4d9",
    park: "#b4d49a",
    forest: "#8fb87a",
    grass: "#c5dbab",
    farmland: "#d9d4a8",
    sand: "#e8dcc8",
    residential: "#e6e2db",
    hillshadeShadow: "#6b5e4e",
    hillshadeHighlight: "#ffffff",
    motorwayFill: "#f0c070",
    motorwayCasing: "#b8843a",
    trunkFill: "#f2d08a",
    trunkCasing: "#c49a48",
    primaryFill: "#efe3a8",
    primaryCasing: "#b8a45c",
    secondaryFill: "#f7f5f0",
    secondaryCasing: "#b8bdc6",
    minorFill: "#ffffff",
    minorCasing: "#c9ced6",
    route: "#2563eb",
    routeCasing: "#1e40af",
    routeGlow: "#93c5fd",
    routeAlt: "#64748b",
    label: "#2a3340",
    labelMuted: "#5a6573",
    labelHalo: "#f5f2eb",
  },
};

export const radii = {
  small: "6px",
  md: "10px",
  lg: "16px",
  pill: "9999px",
};

export const shadows = {
  neonSoft: "0 8px 40px rgba(16,185,129,0.18)",
  neonStrong: "0 24px 80px rgba(16,255,140,0.28)",
  glassInset: "inset 0 1px 0 rgba(255,255,255,0.02)",
};

export default { colors, radii, shadows };
