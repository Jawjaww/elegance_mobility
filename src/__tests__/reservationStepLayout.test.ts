import fs from "fs";
import path from "path";

/**
 * Guards the reservation flow's step split, and the map overlay.
 *
 * The map step (1) is "where", the vehicle step (2) is "when and what": the pickup date used
 * to sit below the map on step 1, where on a phone it cost a full section and pushed the
 * button out of view. Distance and duration moved onto the map as an overlay for the same
 * reason — they are context for the map, not a paragraph after it.
 *
 * `LocationStep` and `VehicleStep` are shared by the creation and the edit flows, so pinning
 * the split here covers both; the two call sites are asserted separately because that is
 * where the date wiring could silently go missing.
 *
 * Source-level assertions, as elsewhere in this folder: the repository has no
 * component-rendering setup, and which step owns the picker is the thing being pinned.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const RESERVATION_DIR = path.join(PROJECT_ROOT, "src/components/reservation");
const LOCATION_STEP = path.join(RESERVATION_DIR, "LocationStep.tsx");
const VEHICLE_STEP = path.join(RESERVATION_DIR, "VehicleStep.tsx");
const TRIP_STATS_BADGE = path.join(RESERVATION_DIR, "TripStatsBadge.tsx");
const CREATE_PAGE = path.join(PROJECT_ROOT, "src/app/(public-portal)/reservation/page.tsx");
const EDIT_PAGE = path.join(
  PROJECT_ROOT,
  "src/app/(client-portal)/my-account/reservations/edit/page.tsx",
);
const DEAD_DYNAMIC_STEP = path.join(RESERVATION_DIR, "DynamicLocationStep.tsx");

/**
 * Comments removed in a single pass, block form first: stripping the block form and then the
 * line form lets a block opener typed inside a line comment swallow the code that follows.
 * These files explain the change by naming the very tokens the assertions look for, so the
 * comments must go before any assertion. Whitespace is collapsed last.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ");
}

function readSource(file: string): string {
  return stripComments(fs.readFileSync(file, "utf8")).replace(/\s+/g, " ");
}

/**
 * The first `<Component …>` element of a file, tag included, so a prop can be asserted
 * *per call site* rather than per file — the create page renders both steps, and a file-wide
 * search could not tell which one received the date.
 */
function jsxElement(source: string, component: string): string {
  const start = source.indexOf(`<${component}`);
  if (start < 0) return "";

  const rest = source.slice(start);
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] !== ">") continue;
    // Skip the `>` of an arrow function inside a prop callback (`=>`), which would otherwise
    // end the tag early and hide every prop written after it.
    if (rest[i - 1] === "=") continue;
    return rest.slice(0, i + 1);
  }
  return rest;
}

describe("reservation step layout", () => {
  it("keeps the pickup date off the map step", () => {
    const source = readSource(LOCATION_STEP);

    expect(source).not.toMatch(/<DateTimeStep/);
    expect(source).not.toContain("DateTimeStep");
    expect(source).not.toContain("Date et heure de prise en charge");
    // The standalone stats line the overlay replaced.
    expect(source).not.toContain("Durée");
  });

  it("puts the pickup date on the vehicle step", () => {
    const source = readSource(VEHICLE_STEP);

    expect(source).toMatch(/<DateTimeStep/);
    expect(source).toContain("Date et heure de prise en charge");
    // The props have to exist for the call sites to be able to wire them.
    expect(source).toContain("onDateTimeChange");
    expect(source).toContain("pickupDateTime");
  });

  it("keeps the route figures off the vehicle step", () => {
    const source = readSource(VEHICLE_STEP);

    // They were repeated here twice — a card on desktop, a line on a phone — while step one
    // already overlays them on the map. The copies spent a row on the step that has to fit above
    // the fold; that row now pays for the two-line option tiles (see stepTwoCompactness).
    expect(source).not.toContain("Durée estimée");
    expect(source).not.toContain("formatDuration");
    // The props went with the markup, rather than lingering with no reader.
    expect(source).not.toContain("distance?: number");
    expect(source).not.toContain("duration?: number");
    // Non-vacuity: the step still renders its own content.
    expect(source).toContain("Choisissez votre véhicule");
    expect(source).toContain("Options");
  });

  it("wires the date to the vehicle step on both the creation and the edit page", () => {
    for (const page of [CREATE_PAGE, EDIT_PAGE]) {
      const source = readSource(page);

      const locationStep = jsxElement(source, "LocationStep");
      const vehicleStep = jsxElement(source, "VehicleStep");

      // Non-vacuity: prove the extraction found the real elements before asserting on the
      // absence of a prop, which an empty string would also satisfy.
      expect(locationStep).toContain("onNextStep");
      expect(vehicleStep).toContain("onConfirm");

      expect(vehicleStep).toContain("onDateTimeChange={");
      expect(vehicleStep).toContain("pickupDateTime={");
      // Removing the props from the step is not enough: a leftover one would be passed to a
      // component whose interface no longer declares it.
      expect(locationStep).not.toContain("onDateTimeChange");
      expect(locationStep).not.toContain("pickupDateTime");
      // Same rule for the route figures, which the step stopped taking.
      expect(vehicleStep).not.toContain("distance=");
      expect(vehicleStep).not.toContain("duration=");
    }
  });

  it("lays the trip stats over the map instead of under it", () => {
    const source = readSource(LOCATION_STEP);

    expect(source).toMatch(/<TripStatsBadge/);
    // The overlay positions against the map wrapper, which also clips it to the corners.
    expect(source).toContain("relative min-h-0 flex-1 overflow-hidden");
  });

  it("keeps the overlay from swallowing the map drag", () => {
    const source = readSource(TRIP_STATS_BADGE);

    expect(source).toContain("absolute");
    // The map underneath is draggable; an overlay that took pointer events would eat the drag
    // that starts on top of it.
    expect(source).toContain("pointer-events-none");
    expect(source).toContain("formatDuration");
    // Nothing to show until the route is known, and an empty pill over the map would be worse
    // than none.
    expect(source).toMatch(/if \(!distance \|\| !duration\) return null;/);
  });

  it("renders the overlay as light glass, pinned to the map's top-left", () => {
    const source = readSource(TRIP_STATS_BADGE);

    expect(source).toContain("left-3 top-3");
    expect(source).not.toContain("bottom-3");
    // Glass: a translucent tint over a strong blur, held by a light rim.
    expect(source).toContain("backdrop-blur-xl");
    expect(source).toContain("bg-white/55");
    expect(source).toContain("border-white/60");
    // Dark text is what makes a *light* tint readable: white text would need a dark backdrop,
    // and over pale tiles that combination measured contrast 1.00 (invisible). The pairing is
    // the fix, so assert both halves of it.
    expect(source).toContain("text-neutral-900");
    expect(source).not.toContain("text-white");
    // And it stays translucent — the dark variant read as a chip, not as glass.
    expect(source).not.toContain("bg-neutral-950/60");
    expect(source).not.toContain("backdrop-blur-md");
  });

  it("leaves no dynamic wrapper for the old step arrangement", () => {
    // Zero imports in either app before removal: the component only referenced itself.
    expect(fs.existsSync(DEAD_DYNAMIC_STEP)).toBe(false);
  });
});
