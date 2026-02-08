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
