import fs from "fs";
import path from "path";

/**
 * Guards the step-two layout.
 *
 * Step two has to fit above the fold on a phone: it carries the vehicle tiles, five options and
 * the pickup date, and anything that overflows pushes the confirm button out of sight. The date
 * block was measured on a 390x844 viewport before being compacted (114px -> 66px).
 *
 * The options took two passes. A single-row tile first bought about 20px per row, which helped
 * the fold but shared each tile's width between the label and the price: at 360px the label got
 * ~64px and clipped the longest name — "Siège enfant" measured 68px of text, so it rendered as an
 * ellipsis. The route figures were then dropped from this step, where they had been a desktop
 * card plus a phone line on top of the overlay step one already shows, and that freed row now
 * pays for a two-line tile. Measured at 360x844: tiles 42px -> 44px, options block 142px ->
 * 147px, confirm button bottom 689px -> 658px, truncated labels 1 -> 0.
 *
 * Source-level assertions, as elsewhere in this folder: which layout each block uses is the
 * thing being pinned, and the repository has no component-rendering setup.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const RESERVATION_DIR = path.join(PROJECT_ROOT, "src/components/reservation");
const OPTIONS = path.join(RESERVATION_DIR, "ReservationOptionsToggles.tsx");
const DATE_TIME_STEP = path.join(RESERVATION_DIR, "DateTimeStep.tsx");
const DATE_TIME_PICKER = path.join(PROJECT_ROOT, "src/components/ui/date-time-picker.tsx");

/**
 * Comments removed in a single pass, block form first: stripping the block form and then the
 * line form lets a block opener typed inside a line comment swallow the code that follows.
 * Whitespace is collapsed last so multi-line class strings compare predictably.
 */
function readSource(file: string): string {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ")
    .replace(/\s+/g, " ");
}

describe("step two compactness", () => {
  it("lays each option out on two lines", () => {
    const source = readSource(OPTIONS);

    // The label owns a line and the price sits under it, so neither competes for the tile's
    // width with the other.
    expect(source).toContain(
      "flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left",
    );
    expect(source).toContain("font-semibold leading-tight text-white");
    // Non-vacuity: the stack is actually rendered inside each tile, not a stray class name.
    expect(source).toMatch(/<button[\s\S]*flex min-w-0 flex-1 flex-col/);

    // A clipped option name is the very defect this layout removes, so the label must not
    // truncate. It wraps instead.
    expect(source).not.toContain("truncate");

    // The price keeps its full label for screen readers via aria-label, because the visible text
    // is shortened ("Animaux" for "Animaux domestiques").
    expect(source).toContain("aria-label={ariaLabel}");
  });

  it("keeps the selected badge clear of the option text", () => {
    const source = readSource(OPTIONS);

    // The badge is absolutely positioned in the top-right corner; without reserved padding the
    // text column runs under it. Verified in the DOM: 0 overlaps over 5 options.
    expect(source).toContain("absolute right-1 top-1");
    expect(source).toContain("pr-6");
  });

  it("keeps the picker and its shortcut on one row", () => {
    const source = readSource(DATE_TIME_STEP);

    expect(source).toContain("flex items-center gap-2");
    // The picker takes the remaining width; the shortcut keeps its own.
    expect(source).toContain("min-w-0 flex-1");
    expect(source).toContain("h-10 shrink-0 whitespace-nowrap");
    // The stacked variant, which gave the shortcut a line of its own (~44px).
    expect(source).not.toContain('<div className="space-y-2">');
  });

  it("lets the caller decide the picker width", () => {
    const source = readSource(DATE_TIME_PICKER);

    // `max-w-sm` capped the field regardless of the row it sits in, which is what prevented the
    // picker and the shortcut from sharing a line.
    expect(source).not.toContain("max-w-sm");
    expect(source).toContain("flex w-full min-w-0 items-center gap-2");
  });
});
