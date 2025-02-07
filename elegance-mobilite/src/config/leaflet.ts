// Configuration générale de Leaflet
export const leafletConfig = {
  defaultCenter: {
    lat: 48.8566,
    lng: 2.3522
  },
  defaultZoom: 13,
  tileLayer: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  routing: {
    lineOptions: {
      styles: [
        { color: 'black', opacity: 0.15, weight: 9 },
        { color: '#3388ff', opacity: 0.8, weight: 6 },
        { color: 'white', opacity: 0.3, weight: 4 }
      ]
    },
    router: {
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }
  },
  markers: {
    pickup: {
      icon: "fa-map-marker",
      color: "green",
      prefix: "fa"
    },
    dropoff: {
      icon: "fa-map-marker",
      color: "red",
      prefix: "fa"
    }
  },
  mapOptions: {
    scrollWheelZoom: true,
    zoomControl: true,
    dragging: true,
    maxZoom: 18,
    minZoom: 3
  }
} as const;

// Types pour la configuration
export interface LeafletMarkerConfig {
  icon: string;
  color: string;
  prefix: string;
}

export interface LeafletRouteStyle {
  color: string;
  opacity: number;
  weight: number;
}

// Options par défaut pour le style de la carte
export const defaultMapStyle = {
  height: "400px",
  width: "100%"
};