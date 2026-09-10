import {
  ADMIN_RIDES_PAGE_SIZE,
  adminRidesKeysetOr,
  adminRidesSearchOrFilter,
  fetchAdminRidesChunk,
  nextAdminRidesCursor,
  pickupWindow,
} from "../fetchAdminRidesChunk";

describe("pickupWindow", () => {
  it("uses an exclusive next-day end in day mode", () => {
    const { start, end } = pickupWindow(new Date(2026, 8, 10, 15, 30), "day");
    expect(start).toEqual(new Date(2026, 8, 10));
    expect(end).toEqual(new Date(2026, 8, 11));
  });

  it("uses an exclusive next-month end in month mode", () => {
    const { start, end } = pickupWindow(new Date(2026, 8, 10), "month");
    expect(start).toEqual(new Date(2026, 8, 1));
    expect(end).toEqual(new Date(2026, 9, 1));
  });
});

describe("adminRidesKeysetOr", () => {
  it("builds a composite (pickup_time, id) filter", () => {
    expect(
      adminRidesKeysetOr({
        pickup_time: "2026-09-10T08:00:00.000Z",
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      }),
    ).toBe(
      'pickup_time.gt."2026-09-10T08:00:00.000Z",and(pickup_time.eq."2026-09-10T08:00:00.000Z",id.gt."aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")',
    );
  });
});

describe("adminRidesSearchOrFilter", () => {
  it("returns null for blank search", () => {
    expect(adminRidesSearchOrFilter("  ")).toBeNull();
  });

  it("matches a UUID on id", () => {
    expect(
      adminRidesSearchOrFilter("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"),
    ).toBe("id.eq.aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  });

  it("ilikes pickup and dropoff otherwise", () => {
    expect(adminRidesSearchOrFilter("Gare de Lyon")).toBe(
      'pickup_address.ilike."%Gare de Lyon%",dropoff_address.ilike."%Gare de Lyon%"',
    );
  });
});

describe("nextAdminRidesCursor", () => {
  it("returns undefined when the page is short", () => {
    expect(
      nextAdminRidesCursor(
        [{ pickup_time: "t", id: "1" }],
        ADMIN_RIDES_PAGE_SIZE,
      ),
    ).toBeUndefined();
  });

  it("returns the last row when the page is full", () => {
    const page = Array.from({ length: 3 }, (_, i) => ({
      pickup_time: `t${i}`,
      id: `id-${i}`,
    }));
    expect(nextAdminRidesCursor(page, 3)).toEqual({
      pickup_time: "t2",
      id: "id-2",
    });
  });
});

describe("fetchAdminRidesChunk", () => {
  it("applies window, status, keyset and limit on the query builder", async () => {
    const calls: string[] = [];
    const builder: Record<string, unknown> = {};
    const chain = (name: string) =>
      jest.fn((...args: unknown[]) => {
        calls.push(`${name}:${JSON.stringify(args)}`);
        return builder;
      });

    builder.select = chain("select");
    builder.gte = chain("gte");
    builder.lt = chain("lt");
    builder.eq = chain("eq");
    builder.in = chain("in");
    builder.or = chain("or");
    builder.order = chain("order");
    builder.limit = chain("limit");
    builder.then = (
      resolve: (value: { data: unknown[]; error: null }) => unknown,
    ) => resolve({ data: [], error: null });

    const client = {
      from: jest.fn(() => builder),
    };

    await fetchAdminRidesChunk(client as never, {
      startIso: "2026-09-10T00:00:00.000Z",
      endIso: "2026-09-11T00:00:00.000Z",
      status: "pending",
      cursor: {
        pickup_time: "2026-09-10T08:00:00.000Z",
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      },
      limit: 20,
    });

    expect(client.from).toHaveBeenCalledWith("rides");
    expect(calls.some((c) => c.startsWith("gte:"))).toBe(true);
    expect(calls.some((c) => c.startsWith("lt:"))).toBe(true);
    expect(calls).toContain('eq:["status","pending"]');
    expect(calls.some((c) => c.startsWith("or:"))).toBe(true);
    expect(calls).toContain("limit:[20]");
  });

  it("filters canceled statuses with .in", async () => {
    const calls: string[] = [];
    const builder: Record<string, unknown> = {};
    const chain = (name: string) =>
      jest.fn((...args: unknown[]) => {
        calls.push(`${name}:${JSON.stringify(args)}`);
        return builder;
      });

    builder.select = chain("select");
    builder.gte = chain("gte");
    builder.lt = chain("lt");
    builder.eq = chain("eq");
    builder.in = chain("in");
    builder.or = chain("or");
    builder.order = chain("order");
    builder.limit = chain("limit");
    builder.then = (
      resolve: (value: { data: unknown[]; error: null }) => unknown,
    ) => resolve({ data: [], error: null });

    const client = { from: jest.fn(() => builder) };

    await fetchAdminRidesChunk(client as never, {
      startIso: "2026-09-10T00:00:00.000Z",
      endIso: "2026-09-11T00:00:00.000Z",
      status: "canceled",
    });

    expect(calls.some((c) => c.startsWith("in:"))).toBe(true);
    expect(calls.some((c) => c.startsWith("eq:"))).toBe(false);
  });

  it("skips the calendar window for delayed urgencies", async () => {
    const calls: string[] = [];
    const builder: Record<string, unknown> = {};
    const chain = (name: string) =>
      jest.fn((...args: unknown[]) => {
        calls.push(`${name}:${JSON.stringify(args)}`);
        return builder;
      });

    builder.select = chain("select");
    builder.gte = chain("gte");
    builder.lt = chain("lt");
    builder.eq = chain("eq");
    builder.in = chain("in");
    builder.or = chain("or");
    builder.order = chain("order");
    builder.limit = chain("limit");
    builder.then = (
      resolve: (value: { data: unknown[]; error: null }) => unknown,
    ) => resolve({ data: [], error: null });

    const client = { from: jest.fn(() => builder) };

    await fetchAdminRidesChunk(client as never, {
      startIso: "2026-09-10T00:00:00.000Z",
      endIso: "2026-09-11T00:00:00.000Z",
      status: "delayed",
    });

    expect(calls.some((c) => c.startsWith("gte:"))).toBe(false);
    expect(calls.some((c) => c.startsWith("lt:"))).toBe(false);
    expect(calls.some((c) => c.startsWith("or:"))).toBe(true);
  });
});
