const mockFrom = jest.fn();

jest.mock("@/lib/database/client", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { syncVehicleDriverAssignment } from "@/lib/vehicle";

describe("syncVehicleDriverAssignment", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("no-ops when driverId is null", async () => {
    await syncVehicleDriverAssignment("vehicle-1", null, true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("no-ops when isPrimary is false", async () => {
    await syncVehicleDriverAssignment("vehicle-1", "driver-1", false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("clears other primary vehicles and sets driver current_vehicle_id", async () => {
    const vehiclesChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockResolvedValue({ error: null }),
    };
    const driversChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "vehicles") return vehiclesChain;
      if (table === "drivers") return driversChain;
      throw new Error(`unexpected table ${table}`);
    });

    await syncVehicleDriverAssignment("vehicle-1", "driver-1", true);

    expect(mockFrom).toHaveBeenCalledWith("vehicles");
    expect(vehiclesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_primary: false }),
    );
    expect(vehiclesChain.eq).toHaveBeenCalledWith("driver_id", "driver-1");
    expect(vehiclesChain.neq).toHaveBeenCalledWith("id", "vehicle-1");

    expect(mockFrom).toHaveBeenCalledWith("drivers");
    expect(driversChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_vehicle_id: "vehicle-1" }),
    );
    expect(driversChain.eq).toHaveBeenCalledWith("id", "driver-1");
  });
});
