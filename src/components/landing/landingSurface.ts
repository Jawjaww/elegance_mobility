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

export const LANDING_KICKER =
  "text-[11px] md:text-xs font-medium uppercase tracking-[0.2em] text-blue-400";

export const LANDING_LINK =
  "text-blue-400 hover:text-blue-300 transition-colors";
