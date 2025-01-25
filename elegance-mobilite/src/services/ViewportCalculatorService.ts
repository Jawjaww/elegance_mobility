import type { LatLng } from '../lib/types';

export class ViewportCalculatorService {
  private readonly MIN_ZOOM = 6;
  private readonly MAX_ZOOM = 12;
  private readonly ZOOM_FACTOR = 0.8;

  calculateOptimalViewport(
    points: LatLng[],
    containerDimensions: { width: number; height: number }
  ) {
    if (points.length === 0) {
      return {
        center: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
        zoom: this.MIN_ZOOM,
        bounds: {
          north: 49.1,
          south: 48.5,
          east: 2.9,
          west: 1.7
        }
      };
    }

    // Calcul des bounds
    const bounds = this.calculateBounds(points);
    
    // Calcul du zoom optimal
    const zoom = this.calculateOptimalZoom(bounds, containerDimensions);
    
    return {
      center: this.calculateCenter(bounds),
      zoom: Math.min(Math.max(zoom, this.MIN_ZOOM), this.MAX_ZOOM),
      bounds: {
        north: 49.1,
        south: 48.5,
        east: 2.9,
        west: 1.7
      }
    };
  }

  public calculateBounds(points: LatLng[]) {
    if (points.length === 0) {
      throw new Error('Cannot calculate bounds from empty points array');
    }

    const bounds = new google.maps.LatLngBounds();
    points.forEach(point => bounds.extend(point));
    return bounds;
  }

  private calculateOptimalZoom(
    bounds: google.maps.LatLngBounds,
    containerDimensions: { width: number; height: number }
  ): number {
    const { width, height } = containerDimensions;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    const latDiff = Math.abs(ne.lat() - sw.lat());
    const lngDiff = Math.abs(ne.lng() - sw.lng());
    
    const latZoom = Math.log2(360 * (height / 256) / latDiff);
    const lngZoom = Math.log2(360 * (width / 256) / lngDiff);
    
    return Math.min(latZoom, lngZoom) * this.ZOOM_FACTOR * 0.8;
  }

  private calculateCenter(bounds: google.maps.LatLngBounds): LatLng {
    const center = bounds.getCenter();
    return {
      lat: center.lat(),
      lng: center.lng()
    };
  }
}