export interface LeafletMapProps {
  startPoint?: { lat: number; lon: number } | null;
  endPoint?: { lat: number; lon: number } | null;
  enableRouting?: boolean;
  onRouteCalculated?: (distance: number, duration?: number) => void;
  // Ajouter aliases compatibles avec le code existant
  origin?: { lat: number; lon: number } | null;
  destination?: { lat: number; lon: number } | null;
}

export interface MapMarker {
  position: [number, number];
  address?: string;
  color?: string;
  icon?: string;
  tooltip?: string;
}

export interface LocationSearchProps {
  onLocationSelect: (location: any) => void;
}
