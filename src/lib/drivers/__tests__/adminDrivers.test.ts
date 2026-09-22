jest.mock("@/lib/database/client", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

import { supabase } from "@/lib/database/client";
import {
  driverDisplayName,
  fetchDriverAccountEmails,
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
    account_email: null,
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

  it("filters by account email, the field that separates same-named drivers", () => {
    // The case this feature exists for: two drivers with the same name, distinguished only by
    // their account. Searching the email must land on the right dossier.
    const homonyms = [
      makeDriver({
        id: "d1",
        first_name: "Jaw",
        last_name: "Ben",
        account_email: "jaw.ben@example.com",
      }),
      makeDriver({
        id: "d2",
        first_name: "jaw",
        last_name: "ben",
        account_email: "jaw-ben-other@example.com",
      }),
    ];

    expect(filterDrivers(homonyms, "jaw.ben@example.com", "all")[0]?.id).toBe("d1");
    expect(filterDrivers(homonyms, "jaw-ben-other", "all")[0]?.id).toBe("d2");
    // Case-insensitive, like every other field of this filter.
    expect(filterDrivers(homonyms, "JAW.BEN@", "all")[0]?.id).toBe("d1");
    // A driver whose email could not be resolved must not match an email query by accident.
    expect(
      filterDrivers([makeDriver({ account_email: null })], "example.com", "all"),
    ).toHaveLength(0);
  });
});

describe("fetchDriversWithVehicles", () => {
  const mockFrom = supabase.from as jest.Mock;
  const mockRpc = supabase.rpc as jest.Mock;

  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
    // The email is a secondary field: most tests do not care about it, and leaving the mock
    // unresolved would fail them for the wrong reason.
    mockRpc.mockResolvedValue({ data: [], error: null });
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

  it("attaches the account email to each driver", async () => {
    const driverRow = makeDriver({ current_vehicle_id: null });
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
      throw new Error(`unexpected table ${table}`);
    });
    mockRpc.mockResolvedValue({
      data: [{ driver_id: "driver-1", email: "marie.dupont@example.com" }],
      error: null,
    });

    const rows = await fetchDriversWithVehicles();
    expect(rows[0]?.account_email).toBe("marie.dupont@example.com");
  });

  it("still lists drivers when the email RPC is unavailable", async () => {
    // The RPC is newer than the app: a cloud deploy can lag a Vercel release, so an error must
    // degrade to "no email shown", never to an empty list.
    const driverRow = makeDriver({ current_vehicle_id: null });
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
      throw new Error(`unexpected table ${table}`);
    });
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "function does not exist" },
    });

    const rows = await fetchDriversWithVehicles();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.account_email).toBeNull();
  });
});

describe("fetchDriverAccountEmails", () => {
  const mockRpc = supabase.rpc as jest.Mock;

  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("keys the result by dossier id", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { driver_id: "d1", email: "one@example.com" },
        { driver_id: "d2", email: "two@example.com" },
      ],
      error: null,
    });

    const byDriverId = await fetchDriverAccountEmails(["d1", "d2"]);
    expect(byDriverId.get("d1")).toBe("one@example.com");
    expect(byDriverId.get("d2")).toBe("two@example.com");
    expect(mockRpc).toHaveBeenCalledWith("admin_driver_account_emails", {
      p_driver_ids: ["d1", "d2"],
    });
  });

  it("sends each dossier once, and skips an empty request", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await fetchDriverAccountEmails(["d1", "d1", "d2"]);
    expect(mockRpc).toHaveBeenCalledWith("admin_driver_account_emails", {
      p_driver_ids: ["d1", "d2"],
    });

    mockRpc.mockClear();
    // No ids means no request: an empty `uuid[]` would be a pointless round trip on a page
    // whose filters match nothing.
    const empty = await fetchDriverAccountEmails([]);
    expect(empty.size).toBe(0);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("returns an empty map instead of throwing when the RPC fails", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "permission denied for function" },
    });

    await expect(fetchDriverAccountEmails(["d1"])).resolves.toEqual(new Map());
  });
});
