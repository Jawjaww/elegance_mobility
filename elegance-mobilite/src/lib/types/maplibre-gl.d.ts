import maplibregl from 'maplibre-gl';

// Étendre le type MapOptions de maplibregl pour inclure les propriétés manquantes
declare module 'maplibre-gl' {
  interface MapOptions {
    preserveDrawingBuffer?: boolean;
    fadeDuration?: number;
    crossSourceCollisions?: boolean;
    locale?: { [key: string]: string };
  }
}
