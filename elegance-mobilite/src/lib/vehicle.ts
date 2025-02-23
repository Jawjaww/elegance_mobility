import { Database } from './database.types'
import { createClient } from '@supabase/supabase-js'

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type NewVehicle = Database['public']['Tables']['vehicles']['Insert']
export type UpdateVehicle = Database['public']['Tables']['vehicles']['Update']
export type VehicleType = Database['public']['Enums']['vehicle_type_enum']

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Fetches all vehicles from the database
 */
export async function getAllVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Error fetching vehicles: ${error.message}`)
  }

  return data
}

/**
 * Fetches a vehicle by its ID
 */
export async function getVehicleById(id: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Error fetching vehicle: ${error.message}`)
  }

  return data
}

/**
 * Creates a new vehicle
 */
export async function createVehicle(vehicle: NewVehicle) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single()

  if (error) {
    throw new Error(`Error creating vehicle: ${error.message}`)
  }

  return data
}

/**
 * Updates an existing vehicle
 */
export async function updateVehicle(id: string, updates: UpdateVehicle) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Error updating vehicle: ${error.message}`)
  }

  return data
}

/**
 * Deletes a vehicle
 */
export async function deleteVehicle(id: string) {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Error deleting vehicle: ${error.message}`)
  }
}

/**
 * Gets all available vehicle types
 */
export function getVehicleTypes(): VehicleType[] {
  return ['STANDARD', 'PREMIUM', 'ELECTRIC', 'VAN']
}