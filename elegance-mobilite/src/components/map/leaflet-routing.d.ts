import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Routing {
    interface RoutingControlOptions {
      waypoints: L.LatLng[];
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      fitSelectedRoute?: boolean;
      lineOptions?: {
        styles?: Array<{
          color: string;
          opacity: number;
          weight: number;
        }>;
      };
      createMarker?: (i: number, waypoint: L.LatLng, n: number) => L.Marker | null;
    }

    interface RouteSummary {
      totalDistance: number;
      totalTime: number;
    }

    interface Route {
      summary: RouteSummary;
    }

    interface RoutingControlStatic {
      new(options: RoutingControlOptions): RoutingControl;
    }

    interface RoutingControl extends L.Control {
      setWaypoints(waypoints: L.LatLng[]): this;
      on(event: 'routesfound', fn: (event: { routes: Route[] }) => void): this;
      remove(): this;
    }

    const control: (options: RoutingControlOptions) => RoutingControl;
  }
}