import * as L from 'leaflet';

declare module 'leaflet.awesome-markers' {
  export type AwesomeMarkerColor =
    | 'red'
    | 'darkred'
    | 'orange'
    | 'green'
    | 'darkgreen'
    | 'blue'
    | 'purple'
    | 'darkpurple'
    | 'cadetblue';

  export interface AwesomeMarkersIconOptions extends L.IconOptions {
    icon?: string;
    prefix?: 'fa' | 'glyphicon' | 'ion';
    markerColor?: AwesomeMarkerColor;
    iconColor?: string;
    spin?: boolean;
    extraClasses?: string;
  }

  namespace AwesomeMarkers {
    class Icon extends L.Icon<AwesomeMarkersIconOptions> {
      constructor(options: AwesomeMarkersIconOptions);
    }
  }

  export = AwesomeMarkers;
}