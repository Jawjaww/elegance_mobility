import type { LatLng } from '../lib/types';

export class EdgePaddingManager {
  private readonly DEFAULT_PADDING = {
    top: 100,
    bottom: 100,
    left: 100,
    right: 100
  };

  private padding = this.DEFAULT_PADDING;

  constructor(private readonly containerRef: HTMLElement) {}

  calculateAdaptivePadding(): typeof this.DEFAULT_PADDING {
    const { clientWidth, clientHeight } = this.containerRef;
    
    // Calcul des paddings en fonction de la taille du conteneur
    return {
      top: Math.min(150, clientHeight * 0.15),
      bottom: Math.min(150, clientHeight * 0.15),
      left: Math.min(100, clientWidth * 0.1),
      right: Math.min(100, clientWidth * 0.1)
    };
  }

  updatePadding(newPadding?: Partial<typeof this.DEFAULT_PADDING>) {
    this.padding = {
      ...this.DEFAULT_PADDING,
      ...newPadding
    };
  }

  getPadding() {
    return this.padding;
  }

  calculateSafeZone(bounds: google.maps.LatLngBounds): LatLng[] {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    const latPadding = (ne.lat() - sw.lat()) * 0.1;
    const lngPadding = (ne.lng() - sw.lng()) * 0.1;

    return [
      { lat: ne.lat() + latPadding, lng: ne.lng() + lngPadding },
      { lat: sw.lat() - latPadding, lng: sw.lng() - lngPadding }
    ];
  }
}