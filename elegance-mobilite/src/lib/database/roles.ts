'use server'

import { SupabaseRole } from '@/lib/types/auth.types' // Utiliser le type depuis auth.types

export const ROLES: { [key in SupabaseRole]: string } = {
  app_super_admin: 'Super Admin',
  app_admin: 'Admin',
  app_driver: 'Chauffeur',
  app_customer: 'Client',
  unauthorized: 'Non autorisé'
}

export const isAdmin = async (role?: SupabaseRole | null) => {
    return role === 'app_admin' || role === 'app_super_admin'
}

export const isDriver = async (role?: SupabaseRole | null) => {
    return role === 'app_driver'
}

export const isCustomer = async (role?: SupabaseRole | null) => {
    return role === 'app_customer'
}
