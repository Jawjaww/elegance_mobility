/**
 * Point d'entrée unifié pour tous les types de l'application
 */

// Ré-exporter les types primaires
export * from './auth.types';
export * from './vehicle.types';
export * from './map-types'; // Import all map types from map-types.ts

// Ne pas essayer d'importer depuis un chemin qui n'existe pas
// Nous exportons ces types directement ici

// Re-export des adaptateurs de fonctions
export { 
  adaptVehicleOptions,
  adaptVehicleType
} from './types';

// Re-export des interfaces de type avec la syntaxe correcte
export type { 
  LeafletRouter,
  LeafletRouteStyle,
  LeafletControlOptions,
  LeafletRoute,
  LeafletPlan,
  LeafletRoutingControl
} from './types';

// Supprimer cette ligne qui cause le conflit car MapMarker est déjà exporté depuis map-types.ts
// export type { MapMarker } from './types';
