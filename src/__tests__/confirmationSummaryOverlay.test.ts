import fs from "fs";
import path from "path";
import { vehicleLabel } from "@/lib/utils/vehicle";

/**
 * Guards the confirmation screens' summary layout.
 *
 * Both screens used to spend a two-row bar on distance, duration and price, plus a "Véhicule"
 * row in the details card. On a phone that ran past the viewport (measured 52px of overflow at
 * 390×844), so the two route figures and the vehicle category moved onto the map as an overlay,
 * and the bar kept only the price. Distance and duration were relocated, not dropped — hence
 * asserting their *new* home as well as their absence from the old one.
 *
 * Source-level assertions, as elsewhere in this folder: the repository has no component
 * rendering setup, and where those figures live is the thing being pinned. The label helper is
 * exercised for real, because a shared helper is only worth sharing if it answers.
 */
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const RESERVATION_DIR = path.join(PROJECT_ROOT, "src/components/reservation");
const CREATE_CONFIRMATION = path.join(RESERVATION_DIR, "ConfirmationDetails.tsx");
const EDIT_CONFIRMATION = path.join(RESERVATION_DIR, "EditConfirmationDetails.tsx");
const CONFIRMATION_FILES: ReadonlyArray<[string, string]> = [
  ["creation", CREATE_CONFIRMATION],
  ["edit", EDIT_CONFIRMATION],
];

/**
 * Comments are removed before any assertion: these files explain the change by naming the very
 * tokens the assertions look for, so a surviving comment would make an absence assertion fail.
 * Whitespace is collapsed so a tag can be matched across its own line breaks.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, " ");
}

function readSource(file: string): string {
  return stripComments(fs.readFileSync(file, "utf8")).replace(/\s+/g, " ");
}

/**
 * The first `<Component …>` element of a file, tag included, so a prop can be asserted per call
 * site rather than per file.
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

describe("confirmation summary", () => {
  it.each(CONFIRMATION_FILES)(
    "lays the trip stats and the vehicle over the map (%s)",
    (_name, file) => {
      const source = readSource(file);
      const overlay = jsxElement(source, "TripStatsBadge");

      // Non-vacuity: an empty string would satisfy every assertion below.
      expect(overlay).toContain("distance={");
      expect(overlay).toContain("duration={");
      // The vehicle category rides on the overlay on these screens. That is what lets the
      // details card drop its own "Véhicule" row without losing the information.
      expect(overlay).toContain("vehicle={");

      // The overlay positions itself absolutely, so it needs a positioned wrapper that also
      // clips it to the card's rounded corner.
      expect(source).toContain("relative h-48");
    },
  );

  it.each(CONFIRMATION_FILES)(
    "keeps the route figures out of the summary bar (%s)",
    (_name, file) => {
      const source = readSource(file);

      // Non-vacuity: prove we found the summary bar before asserting on what it lost.
      expect(source).toContain("Prix de base");
      expect(source).toContain("Total estimé");

      expect(source).not.toContain("Distance estimée");
      expect(source).not.toContain("Durée estimée");

      // The bar now takes the price alone; a leftover prop would be passed to a component whose
      // interface no longer declares it.
      const bar = jsxElement(source, "PriceSummaryBar");
      expect(bar).toContain("priceDetails={");
      expect(bar).not.toContain("distance");
      expect(bar).not.toContain("duration");
    },
  );

  it.each(CONFIRMATION_FILES)(
    "stops repeating the vehicle category in the details card (%s)",
    (_name, file) => {
      const source = readSource(file);

      // Non-vacuity: the date row is still there, so its removal did not empty the block.
      expect(source).toContain('label="Date et heure"');
      expect(source).not.toContain('label="Véhicule"');
    },
  );

  it.each(CONFIRMATION_FILES)(
    "imports the vehicle label instead of redefining it (%s)",
    (_name, file) => {
      const source = readSource(file);

      // The helper was duplicated verbatim in both files; a third copy was about to appear.
      expect(source).not.toMatch(/function vehicleLabel/);
      expect(source).toContain('from "@/lib/utils/vehicle"');
      // Non-vacuity: the label is still actually used, not merely imported.
      expect(source).toContain("vehicleLabel(selectedVehicle)");
    },
  );
});

describe("vehicleLabel", () => {
  it("names the categories the client can book", () => {
    expect(vehicleLabel("STANDARD")).toBe("Berline");
    expect(vehicleLabel("PREMIUM")).toBe("Berline premium");
    expect(vehicleLabel("VAN")).toBe("Van de confort");
  });

  it("passes through a category it has no display name for", () => {
    // Matches the behaviour the two local copies had. Not reachable from the client flow, which
    // only ever offers STANDARD / PREMIUM / VAN, so a raw token is preferable to inventing a
    // label for a category the picker never produces.
    expect(vehicleLabel("ELECTRIC")).toBe("ELECTRIC");
  });
});

/**
 * The redirect guard on the confirmation screen.
 *
 * The draft lives in a persisted store that React reads through `useSyncExternalStore`, and this
 * screen is reachable by deep link. On a hard load (deep link, refresh) the hydration render is
 * handed the store's *initial* state rather than the persisted one, where `departure` and
 * `destination` are still null — so a guard reading the render values bounced the reader to step
 * 1 and threw away a draft that had been on disk the whole time. `getState()` returns the current
 * state, which is hydrated by then.
 *
 * Pinned because the broken form reads perfectly well in review: the values it consults are right
 * there in scope, and it is only wrong on a load path a reviewer rarely takes. Only a test that
 * names the access stops it from coming back.
 */
describe("confirmation deep-link guard", () => {
  /**
   * The `useEffect` that sends an incomplete draft back to step 1.
   *
   * Anchored on the redirect target rather than on `getState()`: that token is absent from the
   * broken form, so anchoring there would find nothing and the assertions below could only
   * report a missing slice. The target itself is in both forms, so a revert is extracted and
   * judged.
   *
   * Last occurrence, because the confirmation button's neighbour `handleModify` also returns to
   * `/reservation`.
   */
  function redirectEffect(): { body: string; deps: string } {
    const source = readSource(CREATE_CONFIRMATION);
    const push = source.lastIndexOf('router.push("/reservation")');

    // Non-vacuity: an empty slice would satisfy every assertion below.
    expect(push).toBeGreaterThan(-1);

    const start = source.lastIndexOf("useEffect(", push);
    const end = source.indexOf("]);", push);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(push);

    return { body: source.slice(start, push), deps: source.slice(push, end + 3) };
  }

  it("decides from the current store state, not from the render snapshot", () => {
    expect(redirectEffect().body).toContain("useReservationStore.getState()");
  });

  it("still sends an incomplete draft back to step 1", () => {
    const { body } = redirectEffect();

    // Each of the four, read off the current state. The guard has to stay complete: a dropped
    // condition walks the reader onto a screen that renders the missing field as a blank row.
    expect(body).toContain("!store.departure");
    expect(body).toContain("!store.destination");
    expect(body).toContain("!store.pickupDateTime");
    expect(body).toContain("!store.selectedVehicle");
  });

  it("keeps the render values in its dependency list", () => {
    // The guard reads through `getState()`, so nothing in its body changes when the store
    // updates. These dependencies are the only thing that re-runs the check.
    expect(redirectEffect().deps).toContain(
      "departure, destination, pickupDateTime, selectedVehicle, router",
    );
  });
});
