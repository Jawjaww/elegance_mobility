import { truncateAddress } from "../adminDashboard";

describe("truncateAddress", () => {
  it("returns em dash for empty values", () => {
    expect(truncateAddress(null)).toBe("—");
    expect(truncateAddress(undefined)).toBe("—");
    expect(truncateAddress("   ")).toBe("—");
  });

  it("keeps short addresses intact", () => {
    expect(truncateAddress("12 rue de Paris")).toBe("12 rue de Paris");
  });

  it("truncates long addresses with ellipsis", () => {
    const long = "a".repeat(40);
    expect(truncateAddress(long, 10)).toBe(`${"a".repeat(10)}…`);
  });
});
