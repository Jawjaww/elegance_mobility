/**
 * Utilitaires généraux pour l'application
 */

// Import standard des utilitaires formatages sans coordinate-adapters qui a été supprimé
export * from './date-format';
// export * from './coordinate-adapters'; // Ce fichier a été supprimé

// Export des fonctions utilitaires communes
// export { cn } from './cn';
// export { extractDisplayName, getInitialsFromName } from './user-utils';

// Export des mappeurs de base de données
// export { 
//   normalizeUserRole,
//   normalizeAdminLevel,
//   dbVehicleTypeToEnum, 
//   enumToDbVehicleType,
//   dbOptionsToVehicleOptions,
//   vehicleOptionsToDbOptions
// } from './db-mapping';

// Fonction utilitaire pour formater les montants monétaires
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Fonction utilitaire pour combiner des classes conditionnellement
// Note: cette fonction est généralement définie dans cn.ts mais nous la réexportons ici
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Fonction utilitaire pour créer des délais
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Type générique pour les coordonnées
export interface Coordinates {
  lat: number;
  lon: number; // Standardisé sur lon uniquement
}

// Type pour les règles de validation standard
export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validate?: (value: any) => boolean | string;
};

// Aide à l'importation dynamique
export async function importDynamic(modulePath: string) {
  try {
    return await import(/* @vite-ignore */ modulePath);
  } catch (err) {
    console.error(`Failed to dynamically import ${modulePath}:`, err);
    throw err;
  }
}