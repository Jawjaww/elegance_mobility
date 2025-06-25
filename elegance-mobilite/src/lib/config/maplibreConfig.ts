// Configuration pour MapLibre GL JS

export const maplibreConfig = {
  defaultCenter: [2.3522, 48.8566], // [lon, lat] - Paris
  defaultZoom: 13,
  style: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19
    }]
  },
  routing: {
    serviceUrl: 'https://router.project-osrm.org/route/v1',
    profile: 'driving',
    lineColor: '#3388ff',
    lineWidth: 6,
    lineOpacity: 0.8
  },
  markers: {
    departure: {
      color: '#3FB1CE',
      draggable: false
    },
    destination: {
      color: '#F84C4C',
      draggable: false
    }
  },
  mapOptions: {
    dragRotate: false,
    touchZoomRotate: true,
    maxZoom: 18,
    minZoom: 3
  }
};

// Types pour la configuration
export interface MapLibreMarkerConfig {
  color: string;
  draggable: boolean;
}

export interface MapLibreRouteStyle {
  color: string;
  width: number;
  opacity: number;
}
