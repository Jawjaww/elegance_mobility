export {
  LANDING_BRAND,
  LANDING_CTA,
} from "@/components/landing/landingAssets";

/** Full-page canvas aligned with the landing hero (blue-neutral, not gray metal). */
export const LANDING_PAGE_BG = "relative bg-neutral-950 text-white";

export const LANDING_PAGE_GLOW =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_42%_at_18%_8%,rgba(37,99,235,0.12),transparent_62%)]";

/** Horizontal inset for public form pages (safe area + premium gutter). */
export const LANDING_PAGE_X = "landing-page-x";

/** Auth and short pages: top on mobile, centered from md. */
export const LANDING_PAGE_MAIN = "landing-page-main";

/** Multi-step public flows: always top-aligned. */
export const LANDING_PAGE_FLOW = "landing-page-flow";

/**
 * Glass panel from md up. Mobile stays flush (no card chrome).
 * Keep the fill as dark as the mobile canvas — a whisper of blue, not a mid-blue slab.
 */
export const LANDING_DESKTOP_PANEL =
  "md:relative md:overflow-hidden md:rounded-3xl md:border md:border-white/[0.08] md:bg-neutral-950/95 md:p-8 md:shadow-lg md:shadow-black/40";

/**
 * Snap seam hero → “Comment ça marche”: a short blue band at the top,
 * then near-black before mid-panel so the berline screen does not clash.
 */
export const LANDING_HERO_TO_HOWITWORKS =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#172554_0%,#101628_10%,#0a0a0a_26%)]";

/** Last stretch of the hero: dissolve the Cayenne into the seam color. */
export const LANDING_HERO_BOTTOM_FADE =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_52%,rgb(23_37_84/0.42)_78%,#172554_100%)]";

/** Glass chip over the hero — dark translucent, lets the Cayenne show through. */
export const LANDING_TRUST_GLASS =
  "rounded-2xl border border-white/[0.08] bg-gradient-to-b from-neutral-950/50 to-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_32px_rgba(0,0,0,0.32)] backdrop-blur-xl";

export const LANDING_KICKER =
  "text-[11px] md:text-xs font-medium uppercase tracking-[0.2em] text-blue-400";

export const LANDING_LINK =
  "text-blue-400 hover:text-blue-300 transition-colors";

/** Reservation vehicle / option picker — default and selected card chrome. */
export const RESERVATION_PICKER_CARD =
  "border-neutral-800 bg-neutral-900/80 hover:border-neutral-700";
export const RESERVATION_PICKER_CARD_SELECTED =
  "border-blue-500/40 bg-blue-500/[0.06]";
export const RESERVATION_PICKER_ICON =
  "border-neutral-700 bg-neutral-800";
export const RESERVATION_PICKER_ICON_SELECTED =
  "border-blue-500/30 bg-blue-500/10";
