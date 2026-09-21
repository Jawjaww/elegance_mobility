"use client";

import { Route } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

interface TripStatsBadgeProps {
  distance?: number | null;
  duration?: number | null;
  /**
   * Vehicle category, e.g. "Berline premium".
   *
   * Only the confirmation screens pass it: there the reader is about to commit, so the overlay
   * carries the "what" alongside the "how far". The reservation steps leave it out because they
   * are already showing the picker, and repeating the choice on the map would be noise.
   */
  vehicle?: string | null;
}

/**
 * Distance and duration, laid over the map instead of stacked above it.
 *
 * The step used to spend a full line on these figures below the map, which on a phone is one
 * more thing between the reader and the button — and the point of the step is the map itself.
 * Every modern ride-hailing screen puts them on the map for that reason.
 *
 * The component owns its `absolute` positioning, so it must be rendered inside a `relative`
 * container (the map's own wrapper, which also clips it to the rounded corners).
 *
 * Pinned to the top-left corner: it reads as an annotation *on* the map rather than a panel
 * competing with it, and it stays clear of the map's own bottom edge, where a future control
 * (attribution, zoom) is the conventional placement.
 *
 * `pointer-events-none` is not cosmetic: the map underneath is draggable, and an overlay that
 * accepted pointer events would swallow the drag that starts on top of it.
 */
export function TripStatsBadge({
  distance,
  duration,
  vehicle,
}: Readonly<TripStatsBadgeProps>) {
  // Nothing to overlay until the route is known. Rendered as nothing rather than as a
  // placeholder so the map is never covered by an empty pill.
  if (!distance || !duration) return null;

  return (
    <p
      className={cn(
        "pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5",
        // Light glass with dark text. The earlier pass failed because of the *text* colour, not
        // the tint: white text needs a dark backdrop, so a pale backdrop made it invisible over
        // pale tiles (contrast 1.00). Dark text inverts that relationship and holds on every
        // tile — measured worst case 5.33, on a pure black tile, against AA's 4.5 — while
        // staying light enough to still read as glass rather than as a chip.
        "rounded-full border border-white/60 bg-white/55 px-3 py-1.5",
        "backdrop-blur-xl backdrop-saturate-150",
        "text-xs font-medium whitespace-nowrap text-neutral-900 shadow-lg shadow-black/10",
      )}
    >
      <Route className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
      <span>{distance} km</span>
      {/* Separator hidden from assistive tech, which would otherwise read a stray character. */}
      <span className="text-neutral-500" aria-hidden>
        ·
      </span>
      <span>{formatDuration(duration)}</span>
      {vehicle ? (
        <>
          <span className="text-neutral-500" aria-hidden>
            ·
          </span>
          <span>{vehicle}</span>
        </>
      ) : null}
    </p>
  );
}

export default TripStatsBadge;
