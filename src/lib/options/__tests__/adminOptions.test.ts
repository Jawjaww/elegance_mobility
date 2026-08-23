import { filterOptions } from "../adminOptions";
import type { OptionRow } from "@/lib/services/optionsAdminService";

function makeOption(overrides: Partial<OptionRow> = {}): OptionRow {
  return {
    id: "opt-1",
    name: "Siège bébé",
    description: "Siège auto homologué",
    price: 15,
    available: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("filterOptions", () => {
  const options = [
    makeOption(),
    makeOption({
      id: "opt-2",
      name: "Bouteille d'eau",
      description: "Eau minérale",
    }),
  ];

  it("returns all options when search is empty", () => {
    expect(filterOptions(options, "")).toHaveLength(2);
    expect(filterOptions(options, "   ")).toHaveLength(2);
  });

  it("filters by name", () => {
    expect(filterOptions(options, "bébé")).toHaveLength(1);
    expect(filterOptions(options, "bébé")[0]?.name).toBe("Siège bébé");
  });

  it("filters by description", () => {
    expect(filterOptions(options, "minérale")).toHaveLength(1);
  });

  it("is case insensitive", () => {
    expect(filterOptions(options, "BOUTEILLE")).toHaveLength(1);
  });
});
