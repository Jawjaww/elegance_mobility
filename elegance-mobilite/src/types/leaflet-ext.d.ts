import * as L from 'leaflet';

declare module 'leaflet' {
  interface RoutingControlOptions {
    waypoints: L.LatLng[];
    routeWhileDragging?: boolean;
    showAlternatives?: boolean;
    fitSelectedRoute?: boolean;
    show?: boolean;
    lineOptions?: {
      styles?: Array<{
        color: string;
        opacity: number;
        weight: number;
      }>;
    };
  }

  interface Route {
    coordinates: L.LatLng[];
    summary: {
      totalDistance: number;
      totalTime: number;
    };
  }

  interface RoutingPlan extends L.Control {
    setWaypoints(waypoints: L.LatLng[]): void;
    getWaypoints(): L.LatLng[];
    spliceWaypoints(index: number, waypointsToRemove: number, ...waypointsToAdd: L.LatLng[]): L.LatLng[];
  }

  interface RoutingControl extends L.Control {
    setWaypoints(waypoints: L.LatLng[]): this;
    getWaypoints(): L.LatLng[];
    route(): void;
    hide(): void;
    getPlan(): RoutingPlan;
    on(event: string, fn: (e: { routes: Route[] }) => void): this;
    off(event: string, fn: (e: { routes: Route[] }) => void): this;
  }

  namespace Routing {
    function control(options: RoutingControlOptions): RoutingControl;
  }
}