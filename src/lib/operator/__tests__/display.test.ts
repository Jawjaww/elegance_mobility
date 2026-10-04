import { driverDisplayName, formatAmount, formatRideDateTime } from "../display";

describe("driverDisplayName", () => {
  it("assemble prénom et nom", () => {
    expect(driverDisplayName({ first_name: "Jean", last_name: "Dupont" })).toBe("Jean Dupont");
  });

  it("se contente d'une des deux parties", () => {
    expect(driverDisplayName({ first_name: "Jean", last_name: null })).toBe("Jean");
    expect(driverDisplayName({ first_name: null, last_name: "Dupont" })).toBe("Dupont");
  });

  it("rend un tiret plutôt qu'une chaîne vide", () => {
    expect(driverDisplayName({ first_name: null, last_name: null })).toBe("—");
    expect(driverDisplayName({ first_name: "  ", last_name: "" })).toBe("—");
  });
});

describe("formatAmount", () => {
  it("formate en euros à deux décimales", () => {
    expect(formatAmount(24.5)).toBe("24.50 €");
    expect(formatAmount(0)).toBe("0.00 €");
  });

  it("rend un tiret quand le montant est absent ou invalide", () => {
    expect(formatAmount(null)).toBe("—");
    expect(formatAmount(undefined)).toBe("—");
    expect(formatAmount(Number.NaN)).toBe("—");
  });
});

describe("formatRideDateTime", () => {
  it("rend un tiret quand la date manque ou est illisible", () => {
    expect(formatRideDateTime(null)).toBe("—");
    expect(formatRideDateTime(undefined)).toBe("—");
    expect(formatRideDateTime("pas une date")).toBe("—");
  });

  it("formate une date valide", () => {
    const formatted = formatRideDateTime("2026-10-03T18:30:00.000Z");
    expect(formatted).not.toBe("—");
    expect(formatted).toContain("2026");
  });
});
