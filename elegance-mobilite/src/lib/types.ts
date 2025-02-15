import * as L from 'leaflet';

// Types de base pour l'application
export type VehicleType = 'STANDARD' | 'LUXURY' | 'VAN';

export interface VehicleOptions {
  childSeat: boolean;
  pets: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapMarker {
  position: L.LatLngExpression;
  address: string;
  draggable?: boolean;
  color?: 'red' | 'darkred' | 'orange' | 'green' | 'darkgreen' | 'blue' | 'purple' | 'darkpurple' | 'cadetblue';
  icon?: string;
}

export interface LocationStepProps {
  origin?: Coordinates;
  destination?: Coordinates;
  originAddress: string;
  destinationAddress: string;
  distance?: number;
  duration?: number;
  vehicleType?: VehicleType;
  onOriginChange: (address: string) => void;
  onDestinationChange: (address: string) => void;
  onOriginSelect: (address: string, coordinates: Coordinates) => void;
  onDestinationSelect: (address: string, coordinates: Coordinates) => void;
  onLocationDetected?: (coordinates: Coordinates) => void;
  onRouteCalculated: (distance: number, duration: number) => void;
  pickupDateTime: Date;
  onDateTimeChange: (date: Date) => void;
  onPrevious?: () => void;  // Optionnel car non nécessaire à la première étape
  onNext: () => void;
}

// Types Leaflet étendus
export interface LeafletRouter {
  route(
    waypoints: L.LatLng[],
    callback: (error: Error | null, routes: LeafletRoute[]) => void
  ): void;
}

export interface LeafletRouteStyle {
  color: string;
  opacity: number;
  weight: number;
}

export interface LeafletControlOptions {
  waypoints: L.LatLng[];
  routeWhileDragging?: boolean;
  showAlternatives?: boolean;
  fitSelectedRoute?: boolean;
  show?: boolean;
  lineOptions?: {
    styles?: LeafletRouteStyle[];
  };
  plan?: LeafletPlan;
}

export interface LeafletRoute {
  coordinates: L.LatLng[];
  summary: {
    totalDistance: number;
    totalTime: number;
  };
}

export interface LeafletPlan extends L.Control {
  setWaypoints(waypoints: L.LatLng[]): void;
  getWaypoints(): L.LatLng[];
  spliceWaypoints(index: number, waypointsToRemove: number, ...waypointsToAdd: L.LatLng[]): L.LatLng[];
}

export interface LeafletRoutingControl extends L.Control {
  setWaypoints(waypoints: L.LatLng[]): this;
  getWaypoints(): L.LatLng[];
  route(): void;
  hide(): void;
  getPlan(): LeafletPlan;
  on(event: string, fn: (e: { routes: LeafletRoute[] }) => void): this;
  off(event: string, fn: (e: { routes: LeafletRoute[] }) => void): this;
}

// Extension de Leaflet
declare module 'leaflet' {
  export interface RoutingStatic {
    control(options: LeafletControlOptions): LeafletRoutingControl;
  }

  export interface LeafletStatic {
    Routing: RoutingStatic;
  }
}
