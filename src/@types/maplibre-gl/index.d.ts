import 'maplibre-gl';

declare module 'maplibre-gl' {
  // Définition complète des options MapLibre
  interface MapOptions {
    preserveDrawingBuffer?: boolean;
    fadeDuration?: number;
    crossSourceCollisions?: boolean;
    locale?: { [key: string]: string };
    maxPitch?: number;
    minZoom?: number;
    maxZoom?: number;
    cooperativeGestures?: boolean;
    renderWorldCopies?: boolean;
    // Correction du type pour attributionControl
    attributionControl?: boolean | {
      compact?: boolean;
      customAttribution?: string | string[];
    };
  }

  // Autres interfaces nécessaires pour éviter les erreurs
  interface AttributionControlOptions {
    compact?: boolean;
    customAttribution?: string | string[];
  }
}
