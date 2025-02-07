import * as L from 'leaflet';

declare module 'leaflet' {
  interface RoutingControl extends L.Control {
    route(
      waypoints: L.LatLng[],
      callback: (error: Error | null, routes: Route[]) => void
    ): void;
    
    getPlan(): RoutingPlan;
    getRouter(): Router;
    options: RoutingControlOptions;
  }

  interface Router {
    route(
      waypoints: L.LatLng[],
      callback: (error: Error | null, routes: Route[]) => void
    ): void;
  }

  interface Route {
    coordinates: L.LatLng[];
    name: string;
    summary: {
      totalDistance: number;
      totalTime: number;
    };
    inputWaypoints: Waypoint[];
    waypoints: Waypoint[];
  }

  interface Waypoint extends L.LatLng {
    name?: string;
  }

  interface RoutingControlOptions extends L.ControlOptions {
    waypoints: L.LatLng[];
    router?: Router;
    plan?: RoutingPlan;
    routeWhileDragging?: boolean;
    lineOptions?: {
      styles?: L.PathOptions[];
      extendToWaypoints?: boolean;
      missingRouteTolerance?: number;
    };
  }

  interface RoutingPlan extends L.Control {
    setWaypoints(waypoints: L.LatLng[]): this;
    getWaypoints(): L.LatLng[];
    spliceWaypoints(index: number, waypointsToRemove: number, ...waypointsToAdd: L.LatLng[]): L.LatLng[];
  }

  namespace control {
    function routing(options: RoutingControlOptions): RoutingControl;
  }
}