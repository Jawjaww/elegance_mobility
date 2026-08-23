import {
  filterRates,
  vehicleTypeLabel,
  type RateRow,
} from "../adminRates";

function makeRate(overrides: Partial<RateRow> = {}): RateRow {
  return {
    id: 1,
    vehicleType: "STANDARD",
    basePrice: 10,
    pricePerKm: 2,
    minPrice: 25,
    ...overrides,
  };
}

describe("adminRates helpers", () => {
  const rates = [
    makeRate(),
    makeRate({ id: 2, vehicleType: "PREMIUM", basePrice: 20 }),
    makeRate({ id: 3, vehicleType: "VAN", basePrice: 30 }),
  ];

  it("vehicleTypeLabel maps known types", () => {
    expect(vehicleTypeLabel("STANDARD")).toBe("Standard");
    expect(vehicleTypeLabel("ELECTRIC")).toBe("Électrique");
  });

  it("returns all rates when search is empty", () => {
    expect(filterRates(rates, "")).toHaveLength(3);
  });

  it("filters by enum value", () => {
    expect(filterRates(rates, "van")).toHaveLength(1);
  });

  it("filters by French label", () => {
    expect(filterRates(rates, "premium")).toHaveLength(1);
  });
});
