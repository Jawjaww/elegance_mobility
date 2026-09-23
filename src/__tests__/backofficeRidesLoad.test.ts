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

function vehiclesRequests(): unknown[] {
  return fromMock.mock.calls.filter(([table]) => table === "vehicles");
}

function ridesRequests(): unknown[] {
  return fromMock.mock.calls.filter(([table]) => table === "rides");
}

beforeEach(() => {
  jest.clearAllMocks();
  installedFrom();
  useDriversStore.setState({ drivers: [], loading: false, error: null });
});

describe("the drivers store", () => {
  it("resolves vehicles in one request no matter how many drivers there are", async () => {
    const drivers = [
      { id: "d1", current_vehicle_id: "v1" },
      { id: "d2", current_vehicle_id: "v2" },
      { id: "d3", current_vehicle_id: "v3" },
    ];
    selectSpy.drivers.mockReturnValue(chainable({ data: drivers, error: null }));
    selectSpy.vehicles.mockReturnValue(
      chainable({
        data: [
          { id: "v1", make: "A" },
          { id: "v2", make: "B" },
          { id: "v3", make: "C" },
        ],
        error: null,
      }),
    );

    await useDriversStore.getState().fetchDrivers();

    // The regression this guards: a `.single()` per driver inside a `map`, which made the
    // page pay 1 + N round-trips for a list it renders all at once. Three drivers, one
    // request — and it stays one as the fleet grows.
    expect(vehiclesRequests()).toHaveLength(1);

    // Non-vacuity in the other direction: the batching must still attach the right vehicle,
    // otherwise "one request" would also be satisfied by not resolving vehicles at all.
    const stored = useDriversStore.getState().drivers;
    expect(stored).toHaveLength(3);
    expect(stored.map((driver) => driver.vehicle?.id)).toEqual([
      "v1",
      "v2",
      "v3",
    ]);
  });

  it("asks for no vehicle at all when no driver has one", async () => {
    selectSpy.drivers.mockReturnValue(
      chainable({ data: [{ id: "d1", current_vehicle_id: null }], error: null }),
    );

    await useDriversStore.getState().fetchDrivers();

    expect(vehiclesRequests()).toHaveLength(0);
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

    expect(ridesRequests()).toHaveLength(1);
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

    expect(ridesRequests()).toHaveLength(1);
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
