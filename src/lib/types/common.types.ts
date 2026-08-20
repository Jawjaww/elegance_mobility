/**
 * App-domain types that are NOT part of the generated Supabase schema.
 *
 * For tables, enums, and RPCs prefer:
 *   import type { Database, Driver, Ride, DriverStatus, RideStatus } from '@/lib/types/database.types'
 *
 * Do not redefine Database / table rows here.
 */

import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { RideStatus } from './database.types'
import type { AppRole } from '@/lib/utils/roles'

export type { AppRole } from '@/lib/utils/roles'
export type { RideStatus, DriverStatus, VehicleType } from './database.types'

/** UI filter value including "all" (not a DB enum value) */
export type FilterRideStatus = RideStatus | 'all'

/**
 * Auth user enriched for UI (profile fields may come from public.users / drivers).
 * Prefer Supabase `User` + separate profile fetch when possible.
 */
export interface AppUser extends SupabaseUser {
  first_name?: string
  last_name?: string
  avatar_url?: string
  role?: AppRole
  status?: import('./database.types').DriverStatus
}

/** @deprecated Prefer `AppUser` or `@supabase/supabase-js` User */
export type User = AppUser
