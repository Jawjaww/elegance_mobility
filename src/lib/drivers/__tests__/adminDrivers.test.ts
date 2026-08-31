jest.mock("@/lib/database/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from "@/lib/database/client";
import {
  driverDisplayName,
  fetchDriversWithVehicles,
  filterDrivers,
  vehicleSummaryLabel,
  type DriverWithVehicle,
} from "../adminDrivers";

function makeDriver(
  overrides: Partial<DriverWithVehicle> = {},
): DriverWithVehicle {
  return {
    id: "driver-1",
    user_id: "user-1",
    first_name: "Marie",
    last_name: "Dupont",
    phone: "0601020304",
    status: "active",
    driving_license_number: "AB123",
    current_vehicle_id: null,
    current_vehicle: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    address_line1: null,
    address_line2: null,
    availability_hours: null,
    avatar_url: null,
    city: null,
    company_name: null,
    company_phone: null,
    company_siret: null,
    date_of_birth: null,
    document_urls: null,
    driving_license_categories: null,
    driving_license_expiry_date: null,
    driving_license_issue_date: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    employee_name: null,
    employee_phone: null,
    insurance_expiry_date: null,
    insurance_number: null,
    languages_spoken: null,
    nationality: null,
    payment_provider_account_id: null,
    postal_code: null,
    preferred_zones: null,
    rating: null,
    terms_accepted_at: null,
    total_rides: null,
    vtc_card_expiry_date: null,
    vtc_card_number: null,
    ...overrides,
  };
}

describe("adminDrivers helpers", () => {
  it("formats driver display names", () => {
    expect(driverDisplayName({ first_name: "Jean", last_name: "Martin" })).toBe(
      "Jean Martin",
    );
    expect(driverDisplayName({ first_name: null, last_name: null })).toBe("—");
  });

  it("formats vehicle summary labels", () => {
    expect(
      vehicleSummaryLabel({
        id: "v1",
        make: "BMW",
        model: "Série 5",
        license_plate: "EF-456-GH",
      }),
    ).toBe("BMW Série 5 · EF-456-GH");
    expect(vehicleSummaryLabel(null)).toBeNull();
  });

  it("filters by status and search across name, phone, license, vehicle", () => {
    const drivers = [
      makeDriver({
        id: "d1",
        first_name: "Marie",
        last_name: "Dupont",
        phone: "0601020304",
        status: "active",
        current_vehicle: {
          id: "v1",
          make: "BMW",
          model: "Série 5",
          license_plate: "EF-456-GH",
        },
      }),
      makeDriver({
        id: "d2",
        first_name: "Paul",
        last_name: "Bernard",
        phone: "0708091011",
        status: "draft",
        driving_license_number: "ZZ999",
        current_vehicle: null,
      }),
    ];

    expect(filterDrivers(drivers, "", "active")).toHaveLength(1);
    expect(filterDrivers(drivers, "bernard", "all")[0]?.id).toBe("d2");
    expect(filterDrivers(drivers, "0708", "all")[0]?.id).toBe("d2");
    expect(filterDrivers(drivers, "zz999", "all")[0]?.id).toBe("d2");
    expect(filterDrivers(drivers, "bmw", "all")[0]?.id).toBe("d1");
    expect(filterDrivers(drivers, "inconnu", "all")).toHaveLength(0);
  });
});

describe("fetchDriversWithVehicles", () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("keeps driver rows when vehicles query fails", async () => {
    const driverRow = makeDriver({
      current_vehicle_id: "v1",
      current_vehicle: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "drivers") {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [driverRow],
            error: null,
          }),
        };
      }
      if (table === "vehicles") {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "permission denied for table vehicles" },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await fetchDriversWithVehicles();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("driver-1");
    expect(rows[0]?.current_vehicle).toBeNull();
  });
});
