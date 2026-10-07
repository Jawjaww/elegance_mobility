/**
 * Confirmation must stay short: payment is chosen on the vehicle step, options sit as
 * tap-to-label icons on the map (same 5 s hide as the driver offer payment badge).
 */

describe("confirmation chrome wiring", () => {
  const { readFileSync } = require("fs") as {
    readFileSync: (path: string, encoding: string) => string;
  };
  const { join } = require("path") as { join: (...parts: string[]) => string };
  const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

  const confirmation = read(join("src", "components", "reservation", "ConfirmationDetails.tsx"));
  const edit = read(join("src", "components", "reservation", "EditConfirmationDetails.tsx"));
  const vehicle = read(join("src", "components", "reservation", "VehicleStep.tsx"));
  const overlay = read(join("src", "components", "reservation", "TripOptionOverlay.tsx"));

  it("chooses payment on the vehicle step, not on confirmation", () => {
    expect(vehicle).toContain("PaymentMethodChoice");
    expect(confirmation).not.toContain("PaymentMethodChoice");
    expect(confirmation).toContain("resolvePaymentMethod");
  });

  it("shows selected options as map icons that reveal a label then hide", () => {
    expect(confirmation).toContain("TripOptionOverlay");
    expect(edit).toContain("TripOptionOverlay");
    expect(overlay).toContain("5000");
    expect(overlay).toContain("optionIcon");
  });
});
