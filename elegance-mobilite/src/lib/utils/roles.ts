import type { SupabaseRole } from '@/lib/types/auth.types'

export const isAdmin = (role?: SupabaseRole | null) => {
  return role === 'app_admin' || role === 'app_super_admin'
}

export const isDriver = (role?: SupabaseRole | null) => {
  return role === 'app_driver'
}

export const isCustomer = (role?: SupabaseRole | null) => {
  return role === 'app_customer'
}