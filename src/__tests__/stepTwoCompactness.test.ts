import fs from "fs";
import path from "path";

/**
 * Guards the step-two compaction.
 *
 * Step two has to fit above the fold on a phone: it carries the vehicle tiles, five options and
 * the pickup date, and anything that overflows pushes the confirm button out of sight. Both
 * blocks below were measured on a 390x844 viewport before being changed — options 202px -> 142px,
 * the date block 114px -> 66px, content bottom 807px -> 675px — and neither change truncated a
 * label (checked in the DOM: five options, zero truncated).
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
  it("lays each option out on a single row", () => {
    const source = readSource(OPTIONS);

    // The stacked variant put the price on a second line and cost ~20px per option, i.e. three
    // rows of 62px instead of 42px.
    expect(source).not.toContain("flex flex-col items-center justify-center gap-0.5");
    expect(source).toContain("flex items-center gap-1.5 rounded-xl border py-2 pl-2 pr-5");
    // The label takes the slack and truncates rather than wrapping to a second line.
    expect(source).toContain("min-w-0 flex-1 truncate");
    // The price keeps its full label for screen readers via aria-label, so the visible text can
    // stay on one line.
    expect(source).toContain("aria-label={ariaLabel}");
  });

  it("keeps the selected badge clear of the price", () => {
    const source = readSource(OPTIONS);

    // The badge is absolutely positioned in the top-right corner; without reserved padding the
    // price slides under it. Verified in the DOM: 0 overlaps over 5 options.
    expect(source).toContain("absolute right-1 top-1");
    expect(source).toContain("pr-5");
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
