/**
 * Full-viewport landing page (snap child).
 * Use svh so panels fit with the mobile URL bar / PWA chrome visible —
 * dvh/vh grow when chrome hides and clip the extra copy.
 */
export const LANDING_PANEL =
  "h-[100svh] shrink-0 snap-start snap-always flex flex-col overflow-hidden";

export function getLandingScroller(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector("[data-landing-scroll]");
}

/** Scroll a landing panel inside the snap scroller (native hash would move the window). */
export function scrollLandingTo(
  id: string,
  behavior: ScrollBehavior = "smooth",
) {
  const scroller = getLandingScroller();
  if (!scroller) return;
  if (!id) {
    scroller.scrollTo({ top: 0, behavior });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  const top =
    el.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop;
  scroller.scrollTo({ top, behavior });
}
