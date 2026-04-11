import maplibregl from 'maplibre-gl';

// Limits and timeouts (exported so callers can use the same constants)
export const MAX_ACTIVE_MAPS = 1;
export const FORCE_CLEANUP_TIMEOUT = 500; // ms

class MapRegistry {
  private static instance: MapRegistry;
  private readonly registry = new Map<string, { map: maplibregl.Map; timestamp: number }>();

  private constructor() {}

  public static getInstance(): MapRegistry {
    if (!MapRegistry.instance) {
      MapRegistry.instance = new MapRegistry();
    }
    return MapRegistry.instance;
  }

  public register(id: string, map: maplibregl.Map): void {
    this.registry.set(id, { map, timestamp: Date.now() });
    console.log(`[MapRegistry] Registered ${id}. Total: ${this.registry.size}`);
  }

  public unregister(id: string): void {
    if (this.registry.has(id)) {
      this.registry.delete(id);
      console.log(`[MapRegistry] Unregistered ${id}. Total: ${this.registry.size}`);
    }
  }

  public forceCleanupOldest(): void {
    if (this.registry.size <= MAX_ACTIVE_MAPS) return;

    const instances = Array.from(this.registry.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = instances.slice(0, instances.length - MAX_ACTIVE_MAPS);

    toRemove.forEach(([id, entry]) => {
      console.log(`[MapRegistry] Forcing cleanup of ${id}`);
      try {
        if (entry.map) {
          const markers = entry.map.getContainer().querySelectorAll('.maplibregl-marker');
          markers.forEach((m) => m.remove());

          try {
            if (entry.map.getSource('route')) {
              if (entry.map.getLayer('route-line')) {
                entry.map.removeLayer('route-line');
              }
              entry.map.removeSource('route');
            }
          } catch (e) {
            console.warn(`[MapRegistry] Error cleaning sources for ${id}:`, e);
          }

          entry.map.remove();
        }

        this.unregister(id);
      } catch (e) {
        console.error(`[MapRegistry] Critical error cleaning ${id}:`, e);
      }
    });
  }

  public cleanup(): void {
    this.registry.forEach((entry, id) => {
      try {
        if (entry.map) entry.map.remove();
        this.registry.delete(id);
      } catch (e) {
        console.warn(`[MapRegistry] Error during full cleanup for ${id}:`, e);
      }
    });
    this.registry.clear();
  }

  public getSize(): number {
    return this.registry.size;
  }

  public ensureSingleInstance(currentId: string): void {
    if (this.registry.size <= 1 && this.registry.has(currentId)) return;

    this.registry.forEach((entry, id) => {
      if (id !== currentId) {
        console.log(`[MapRegistry] Cleaning instance ${id} to keep only ${currentId}`);
        try {
          if (entry.map) {
            const markers = entry.map.getContainer().querySelectorAll('.maplibregl-marker');
            markers.forEach((m) => m.remove());

            try {
              if (entry.map.getSource('route')) {
                if (entry.map.getLayer('route-line')) entry.map.removeLayer('route-line');
                entry.map.removeSource('route');
              }
            } catch (e) {
              console.warn(`[MapRegistry] Error cleaning sources for ${id}:`, e);
            }

            entry.map.remove();
          }
          this.unregister(id);
        } catch (e) {
          console.error(`[MapRegistry] Critical error cleaning ${id}:`, e);
        }
      }
    });
  }
}

const mapRegistry = MapRegistry.getInstance();

if (typeof globalThis.window !== 'undefined') {
  globalThis.window.addEventListener('beforeunload', () => {
    mapRegistry.cleanup();
  });
}

export default mapRegistry;
