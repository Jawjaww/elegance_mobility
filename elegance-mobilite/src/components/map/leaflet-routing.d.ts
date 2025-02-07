import * as L from 'leaflet';

declare module 'leaflet' {
  interface RoutingControl extends L.Control {
    on(event: 'routesfound', fn: (event: { routes: Array<{ summary: { totalDistance: number; totalTime: number } }> }) => void): this;
    remove(): this;
  }

  namespace Routing {
    function control(options: {
      waypoints: L.LatLng[];
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      fitSelectedRoute?: boolean;
    }): RoutingControl;
  }
}