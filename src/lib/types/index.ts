/**
 * Point d'entrée types applicatifs.
 *
 * Schema / enums / tables: prefer `@/lib/types/database.types` (generated).
 * App-only (roles UI helpers): `@/lib/types/common.types`.
 */

export type {
  Database,
  Driver,
  Ride,
  DriverStatus,
  RideStatus,
  VehicleType,
  Tables,
  Enums,
} from "./database.types";

export type { AppRole, AppUser, User, FilterRideStatus } from "./common.types";
export * from "./map-types";
