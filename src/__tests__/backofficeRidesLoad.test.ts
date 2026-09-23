/**
 * The courses page load path costs what its request count says it costs.
 *
 * Two of the fixes here are invisible to a reviewer and to a screenshot: the numbers on screen
 * stay identical whether the page spends two round-trips or eight. What changes is latency, and
 * the only way to keep that from silently regressing is to assert the request shape. These tests
 * therefore count calls rather than compare strings.
 */

jest.mock("@/lib/database/client", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

import { supabase } from "@/lib/database/client";
import { useDriversStore } from "@/lib/stores/driversStore";
import {
  loadDelayedQueue,
  loadUpcomingQueue,
} from "@/lib/dashboard/ridesQueueSummary";

/**
 * A PostgREST builder that records nothing but chains like the real one and can be awaited.
 * `await supabase.from(x).select(y)…` resolves to whatever result the table was given.
 */
function chainable(result: unknown) {
  const builder: Record<string, unknown> = {};
  for (const method of [
    "select",
    "order",
    "in",
    "eq",
    "neq",
    "gte",
    "lt",
    "or",
    "limit",
    "single",
    "maybeSingle",
  ]) {
    builder[method] = jest.fn(() => builder);
  }
  builder.then = (onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return builder;
}

const fromMock = supabase.from as unknown as jest.Mock;
const selectSpy = {
  drivers: jest.fn(() => chainable({ data: [], error: null })),
  vehicles: jest.fn(() => chainable({ data: [], error: null })),
  rides: jest.fn(() => chainable({ data: [], error: null, count: 0 })),
};

function installedFrom() {
  fromMock.mockImplementation((table: string) => {
    if (table === "rides") return selectSpy.rides();
    if (table === "vehicles") return selectSpy.vehicles();
    return selectSpy.drivers();
  });
}

function tableRequests(table: string): unknown[] {
  return fromMock.mock.calls.filter(([called]) => called === table);
}

beforeEach(() => {
  jest.clearAllMocks();
  installedFrom();
  useDriversStore.setState({ drivers: [], loading: false, error: null });
});

describe("the drivers store", () => {
  it("loads the whole list in a single request", async () => {
    selectSpy.drivers.mockReturnValue(
      chainable({
        data: [
          { id: "d1", first_name: "A", last_name: "B", phone: null, status: "active" },
          { id: "d2", first_name: "C", last_name: "D", phone: null, status: "active" },
          { id: "d3", first_name: "E", last_name: "F", phone: null, status: "active" },
        ],
        error: null,
      }),
    );

    await useDriversStore.getState().fetchDrivers();

    // The regression this guards: a `.single()` per driver inside a `map`, which made a page
    // pay 1 + N round-trips for a list it renders all at once. Three drivers, one request —
    // and it stays one as the fleet grows.
    expect(tableRequests("drivers")).toHaveLength(1);
    expect(useDriversStore.getState().drivers).toHaveLength(3);
  });

  it("asks for no vehicles at all, because nothing reads driver.vehicle", async () => {
    selectSpy.drivers.mockReturnValue(
      chainable({
        data: [{ id: "d1", first_name: "A", last_name: "B", phone: null, status: "active" }],
        error: null,
      }),
    );

    await useDriversStore.getState().fetchDrivers();

    // A batched vehicle query was tried here and removed: no consumer reads the field, so it
    // was a request bought for nothing. This assertion is what keeps it from coming back.
    expect(tableRequests("vehicles")).toHaveLength(0);
  });

  it("selects the displayed columns rather than every column of the row", async () => {
    selectSpy.drivers.mockReturnValue(chainable({ data: [], error: null }));

    await useDriversStore.getState().fetchDrivers();

    const builder = selectSpy.drivers.mock.results[0]?.value as {
      select: jest.Mock;
    };
    // `select("*")` pulled 42 columns — the whole dossier — to render a name in a select and a
    // status in a filter.
    expect(builder.select).toHaveBeenCalledWith(
      "id, first_name, last_name, phone, status",
    );
  });

  it("surfaces a failure instead of reporting an empty fleet", async () => {
    // A real PostgrestError, not a bare object: supabase-js throws an Error subclass, and the
    // store reads `.message` off it. A plain `{message}` literal would take the fallback branch.
    selectSpy.drivers.mockReturnValue(
      chainable({
        data: null,
        error: Object.assign(new Error("permission denied"), { code: "42501" }),
      }),
    );

    await useDriversStore.getState().fetchDrivers();

    // An empty selector is indistinguishable from a fleet with no drivers, which is exactly
    // the state a swallowed error used to produce.
    expect(useDriversStore.getState().error).toBe("permission denied");
    expect(useDriversStore.getState().loading).toBe(false);
  });
});

describe("the courses queue summary", () => {
  it("fills one card from a single request, count included", async () => {
    selectSpy.rides.mockReturnValue(
      chainable({
        data: [{ pickup_time: "2026-09-23T08:00:00Z" }],
        error: null,
        count: 7,
      }),
    );

    const preview = await loadUpcomingQueue();

    expect(tableRequests("rides")).toHaveLength(1);
    expect(preview).toEqual({ count: 7, pickupTime: "2026-09-23T08:00:00Z" });

    // The count has to come from the same call as the row, which is what `count: "exact"`
    // asks PostgREST for. Without it the card silently loses its total.
    const builder = selectSpy.rides.mock.results[0]?.value as {
      select: jest.Mock;
    };
    expect(builder.select).toHaveBeenCalledWith("pickup_time", {
      count: "exact",
    });
  });

  it("keeps the delayed queue to a single request too", async () => {
    selectSpy.rides.mockReturnValue(
      chainable({ data: [], error: null, count: 0 }),
    );

    const preview = await loadDelayedQueue();

    expect(tableRequests("rides")).toHaveLength(1);
    expect(preview).toEqual({ count: 0, pickupTime: null });
  });

  it("reports an absent pickup time rather than inventing one", async () => {
    selectSpy.rides.mockReturnValue(
      chainable({ data: [], error: null, count: 4 }),
    );

    const preview = await loadUpcomingQueue();

    // A count with no rows is a real state (the queue emptied between the two halves of the
    // request) and must not read as a pickup time.
    expect(preview).toEqual({ count: 4, pickupTime: null });
  });
});
