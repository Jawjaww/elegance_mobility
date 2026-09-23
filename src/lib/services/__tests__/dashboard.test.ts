jest.mock("@/lib/database/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from "@/lib/database/client";
import { getDashboardMetrics } from "../dashboard";

function countResult(
  count: number,
  error: { message: string } | null = null,
) {
  const result = { count, error };
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = jest.fn(self);
  chain.gte = jest.fn(self);
  chain.lt = jest.fn(self);
  chain.eq = jest.fn(self);
  chain.or = jest.fn(self);
  chain.then = (
    onFulfilled: (value: typeof result) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

describe("getDashboardMetrics", () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("returns availableVehicles 0 when vehicles count errors", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "vehicles") {
        return countResult(0, { message: "403" });
      }
      return countResult(2);
    });

    const metrics = await getDashboardMetrics();
    expect(metrics.availableVehicles).toBe(0);
    expect(metrics.activeDrivers).toBe(2);
  });

  it("refuses to answer zero when a ride count failed", async () => {
    // The reported bug: `.count || 0` turned a failed request into a confident
    // "0 course en retard", which the operator read as "nothing is waiting" while the rides
    // list showed two. A count nobody could obtain must never be presented as a count.
    mockFrom.mockImplementation((table: string) => {
      if (table === "rides") {
        return countResult(0, { message: "permission denied for table rides" });
      }
      return countResult(2);
    });

    await expect(getDashboardMetrics()).rejects.toThrow(
      /Compteurs indisponibles/,
    );
  });

  it("names the counter that could not be read", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "driver_locations") {
        return countResult(0, { message: "Failed to fetch" });
      }
      return countResult(2);
    });

    // A bare "something failed" would not tell the operator which number to distrust.
    await expect(getDashboardMetrics()).rejects.toThrow(
      /chauffeurs en ligne/,
    );
  });

  it("still returns every counter when none failed", async () => {
    // Non-vacuity guard in the other direction: the new throw must not fire on a healthy
    // dashboard, or the page would break for everyone.
    mockFrom.mockImplementation(() => countResult(3));

    const metrics = await getDashboardMetrics();
    expect(metrics.delayedRides).toBe(3);
    expect(metrics.pendingRides).toBe(3);
    expect(metrics.activeDrivers).toBe(3);
  });
});
