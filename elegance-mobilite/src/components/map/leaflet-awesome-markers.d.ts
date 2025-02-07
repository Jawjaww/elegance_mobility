import * as L from 'leaflet';

declare module 'leaflet' {
  interface AwesomeMarkersStatic {
    icon(options: AwesomeMarkersIconOptions): L.Icon;
  }

  interface AwesomeMarkersIconOptions {
    icon?: string;
    prefix?: string;
    markerColor?: 'red' | 'darkred' | 'orange' | 'green' | 'darkgreen' | 'blue' | 'purple' | 'darkpurple' | 'cadetblue';
  }

  export const AwesomeMarkers: AwesomeMarkersStatic;
}