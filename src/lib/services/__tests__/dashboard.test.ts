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
});
