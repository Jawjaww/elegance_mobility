/**
 * Utilitaires de mapping entre les structures de base de données et les types TypeScript
 */
import { VehicleType } from '@/lib/types/vehicle.types';
import { UserRole, AdminLevel } from '@/lib/types/auth.types';
import type { DbUser } from '@/lib/types/db.types';

/**
 * Convertit un type de véhicule de la base de données vers l'enum TypeScript
 */
export function dbVehicleTypeToEnum(dbType: string): VehicleType {
  const uppercaseType = dbType.toUpperCase();
  
  switch (uppercaseType) {
    case 'STANDARD':
      return VehicleType.STANDARD;
    case 'PREMIUM':
      return VehicleType.PREMIUM;
    case 'ELECTRIC':
      return VehicleType.ELECTRIC;
    case 'VAN':
      return VehicleType.VAN;
    default:
      console.warn(`Unknown vehicle type: ${dbType}, defaulting to STANDARD`);
      return VehicleType.STANDARD;
  }
}

/**
 * Convertit un enum TypeScript vers le format attendu par la base de données
 */
export function enumToDbVehicleType(enumType: VehicleType): string {
  return enumType.toString();
}

/**
 * Normalise un role utilisateur provenant de la base de données
 */
export function normalizeUserRole(dbRole: string): UserRole {
  switch (dbRole.toLowerCase()) {
    case 'admin':
      return 'admin';
    case 'driver':
      return 'driver';
    case 'client':
      return 'client';
    default:
      console.warn(`Unknown user role: ${dbRole}, defaulting to client`);
      return 'client';
  }
}

/**
 * Normalise un niveau d'admin
 */
export function normalizeAdminLevel(level?: string): AdminLevel | undefined {
  if (!level) return undefined;
  
  switch (level.toLowerCase()) {
    case 'super':
      return 'super';
    case 'standard':
      return 'standard';
    default:
      return undefined;
  }
}

/**
 * Vérifie si un utilisateur est un administrateur et renvoie son niveau
 * Cette fonction ne cherche plus dans la table admins obsolète
 * @param userId L'ID de l'utilisateur
 * @param role Le rôle de l'utilisateur
 * @param adminLevel Le niveau d'administrateur si disponible
 */
export function isUserAdmin(role: string, adminLevel?: string): { isAdmin: boolean, level?: AdminLevel } {
  if (role !== 'admin') {
    return { isAdmin: false };
  }
  
  return { 
    isAdmin: true, 
    level: normalizeAdminLevel(adminLevel) 
  };
}

/**
 * Convertit un tableau d'options de la base de données vers un objet VehicleOptions
 */
export function dbOptionsToVehicleOptions(dbOptions: string[]): Record<string, boolean> {
  const options: Record<string, boolean> = {
    childSeat: false,
    petFriendly: false
  };
  
  if (dbOptions && Array.isArray(dbOptions)) {
    dbOptions.forEach(option => {
      const normalizedOption = option.toLowerCase();
      
      if (normalizedOption === 'childseat' || normalizedOption === 'siège enfant') {
        options.childSeat = true;
      } else if (normalizedOption === 'petfriendly' || normalizedOption === 'animaux domestiques' || normalizedOption === 'pets') {
        options.petFriendly = true;
      }
    });
  }
  
  return options;
}

/**
 * Convertit un objet VehicleOptions vers un tableau d'options pour la base de données
 */
export function vehicleOptionsToDbOptions(options: Record<string, boolean>): string[] {
  const dbOptions: string[] = [];
  
  if (options.childSeat) {
    dbOptions.push('childSeat');
  }
  
  if (options.petFriendly || options.pets) {
    dbOptions.push('petFriendly');
  }
  
  return dbOptions;
}
