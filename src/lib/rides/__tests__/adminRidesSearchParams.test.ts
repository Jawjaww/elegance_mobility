import {
  buildAdminRidesSearchParams,
  parseAdminRidesSearchParams,
} from "../adminRidesSearchParams";

describe("adminRidesSearchParams", () => {
  it("parses dashboard pending filter", () => {
    const parsed = parseAdminRidesSearchParams(
      new URLSearchParams("filter=pending"),
    );
    expect(parsed.selectedStatus).toBe("pending");
  });

  it("parses remaining as month view", () => {
    const parsed = parseAdminRidesSearchParams(
      new URLSearchParams("filter=remaining"),
    );
    expect(parsed.selectedStatus).toBe("all");
    expect(parsed.viewMode).toBe("month");
  });

  it("round-trips date, view and search", () => {
    const query = buildAdminRidesSearchParams({
      selectedDate: new Date(2026, 8, 10),
      viewMode: "day",
      selectedStatus: "pending",
      driverFilter: null,
      clientFilter: null,
      searchQuery: "Gare",
    });
    expect(query).toContain("filter=pending");
    expect(query).toContain("view=day");
    expect(query).toContain("date=2026-09-10");
    expect(query).toContain("q=Gare");

    const parsed = parseAdminRidesSearchParams(new URLSearchParams(query));
    expect(parsed.selectedStatus).toBe("pending");
    expect(parsed.viewMode).toBe("day");
    expect(parsed.selectedDate).toEqual(new Date(2026, 8, 10));
    expect(parsed.searchQuery).toBe("Gare");
  });

  it("parses scheduled and grouped canceled filters", () => {
    expect(
      parseAdminRidesSearchParams(new URLSearchParams("filter=scheduled"))
        .selectedStatus,
    ).toBe("scheduled");
    expect(
      parseAdminRidesSearchParams(new URLSearchParams("filter=canceled"))
        .selectedStatus,
    ).toBe("canceled");
  });
});
