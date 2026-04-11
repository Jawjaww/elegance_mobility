import type { VehicleType as DBVehicleType } from '@/lib/vehicle';

// Runtime list of allowed vehicle type strings (kept in sync with DB enum)
export const VEHICLE_TYPES = [
  "STANDARD",
  "PREMIUM",
  "VAN",
  "ELECTRIC",
] as const;

export type VehicleType = DBVehicleType;

export function isVehicleType(v: unknown): v is VehicleType {
  return typeof v === 'string' && (VEHICLE_TYPES as readonly string[]).includes(v);
}

// Strict validator: returns VehicleType or undefined
export function validateVehicleType(v: unknown): VehicleType | undefined {
  return isVehicleType(v) ? (v as VehicleType) : undefined;
}

// Assertive checker: throws when invalid (use at DB boundaries)
export function assertVehicleType(v: unknown): VehicleType {
  const validated = validateVehicleType(v);
  if (!validated) {
    const msg = `Invalid vehicle type received at runtime: ${String(v)}. Expected one of: ${VEHICLE_TYPES.join(",")}`;
    // Log immediately so server logs contain the full context for intermittent anomalies
    try {
      // Structured log object helps tooling index the error
      console.error('[VEHICLE][ASSERT] %s', msg, { received: v, allowed: VEHICLE_TYPES });
    } catch (e) {
      // ignore logging failures
    }
    // Throw to surface the problem early so we can fix DB/data
    throw new Error(msg);
  }
  return validated;
}

// Back-compat convenience: normalize (keeps previous behavior)
export function normalizeVehicleType(v: unknown): VehicleType {
  return validateVehicleType(v) ?? ("STANDARD" as VehicleType);
}
