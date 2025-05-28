/**
 * Point d'entrée unifié pour tous les types de l'application
 */

// Exporter tous les types depuis common.types
export * from './common.types'
// Ré-exporter les types primaires
export * from './common.types';
export * from './map-types'; // Import all map types from map-types.ts

// Ne pas essayer d'importer depuis un chemin qui n'existe pas
// Nous exportons ces types directement ici

// Re-export des adaptateurs de fonctions
export { 
  adaptVehicleOptions,
  adaptVehicleType
} from './types';


