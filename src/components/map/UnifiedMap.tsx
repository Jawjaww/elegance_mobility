"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Navigation, MapPin, LandPlot, Flag } from "lucide-react";
import { syncMarker } from "./map-helpers/markers";
import { ensureSourcesAndLayers } from "./map-helpers/sources";
import { fetchAndSetRoutes } from "./map-helpers/routes";
import "maplibre-gl/dist/maplibre-gl.css";
import mapStyle from "./mapStyle";

export type MapMode = "REQUEST" | "TRACKING" | "EDIT";

interface Coord {
  lat: number;
  lng: number;
}
interface DriverCoord {
  lat: number;
  lng: number;
  heading?: number;
}
// Legacy location shape from other components (has lon instead of lng and display_name)
interface LegacyLocation {
  lat: number;
  lon: number;
  display_name?: string;
}

interface UnifiedMapProps {
  readonly mode: MapMode;
  readonly pickup?: Coord;
  readonly dropoff?: Coord;
  // Legacy props compatibility
  readonly departure?: LegacyLocation | null;
  readonly destination?: LegacyLocation | null;
  readonly driverLocation?: DriverCoord | null;
  readonly onReady?: () => void;
  readonly onRouteCalculated?: (distance: number, duration: number) => void;
  readonly height?: string;
}

function isValidCoord(c: Coord | null | undefined): c is Coord {
  return (
    !!c &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180
  );
}

function toCoord(
  pickup?: Coord,
  departure?: LegacyLocation | null,
): Coord | undefined {
  if (isValidCoord(pickup)) return pickup;
  if (departure) {
    const c = { lat: departure.lat, lng: departure.lon };
    if (isValidCoord(c)) return c;
  }
  return undefined;
}

function clearMarker(
  id: string,
  markers: Map<string, maplibregl.Marker>,
  roots: Map<string, { unmount: () => void }>,
) {
  const marker = markers.get(id);
  if (marker) {
    try {
      marker.remove();
    } catch {
      /* ignore */
    }
    markers.delete(id);
  }
  const root = roots.get(id);
  if (root) {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
    roots.delete(id);
  }
}

function syncEndpointMarker(
  mapInstance: maplibregl.Map,
  id: "pickup" | "dropoff",
  loc: Coord | undefined,
  icon: unknown,
  color: string,
  markers: Map<string, maplibregl.Marker>,
  roots: Map<string, { unmount: () => void }>,
) {
  if (loc) {
    syncMarker(mapInstance, id, loc, icon, color, markers, roots);
  } else {
    clearMarker(id, markers, roots);
  }
}

function fitMapToPoints(
  mapInstance: maplibregl.Map,
  points: Coord[],
  mode: MapMode,
) {
  if (points.length === 0) return;

  const coords = points.map((p): [number, number] => [p.lng, p.lat]);
  const isShort =
    globalThis.window !== undefined && globalThis.window.innerHeight <= 700;
  const padding = isShort
    ? { top: 40, bottom: 120, left: 40, right: 40 }
    : 80;

  if (coords.length >= 2) {
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(coords[0], coords[0]),
    );
    mapInstance.fitBounds(bounds, {
      padding,
      animate: mode === "TRACKING",
      maxZoom: 15,
    });
    return;
  }

  mapInstance.setCenter(coords[0]);
  mapInstance.setZoom(13);
}

export default function UnifiedMap({
  mode,
  pickup,
  dropoff,
  departure,
  destination,
  driverLocation,
  onReady,
  onRouteCalculated,
  height = "100%",
}: UnifiedMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const roots = useRef<Map<string, { unmount: () => void }>>(new Map());
  const onReadyRef = useRef(onReady);
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const [isLoaded, setIsLoaded] = useState(false);

  onReadyRef.current = onReady;
  onRouteCalculatedRef.current = onRouteCalculated;

  // Create the map once; remount only when mode changes (different layers).
  useEffect(() => {
    if (!mapContainer.current) return;

    const p = toCoord(pickup, departure);
    const d = toCoord(dropoff, destination);
    const paris: [number, number] = [2.3522, 48.8566];
    let initialCenter: [number, number] = paris;
    let initialZoom = 9;

    if (driverLocation) {
      initialCenter = [driverLocation.lng, driverLocation.lat];
      initialZoom = 13;
    } else if (p) {
      initialCenter = [p.lng, p.lat];
      initialZoom = 13;
    } else if (d) {
      initialCenter = [d.lng, d.lat];
      initialZoom = 13;
    }

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.current = mapInstance;

    mapInstance.on("load", () => {
      ensureSourcesAndLayers(mapInstance, mode);
      setIsLoaded(true);
      onReadyRef.current?.();
    });

    return () => {
      markers.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          /* ignore */
        }
      });
      markers.current.clear();
      roots.current.forEach((r) => {
        try {
          r.unmount();
        } catch {
          /* ignore */
        }
      });
      roots.current.clear();
      try {
        mapInstance.remove();
      } catch {
        /* ignore */
      }
      map.current = null;
      setIsLoaded(false);
    };
    // Initial coords only seed center; marker/route sync lives in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Sync markers + route when points change — without remounting the map.
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !isLoaded) return;

    const controller = new AbortController();
    const p = toCoord(pickup, departure);
    const d = toCoord(dropoff, destination);

    syncEndpointMarker(
      mapInstance,
      "pickup",
      p,
      MapPin,
      "#059669",
      markers.current,
      roots.current,
    );
    syncEndpointMarker(
      mapInstance,
      "dropoff",
      d,
      mode === "EDIT" ? Flag : LandPlot,
      "#dc2626",
      markers.current,
      roots.current,
    );

    if (driverLocation && isValidCoord(driverLocation)) {
      syncMarker(
        mapInstance,
        "driver",
        driverLocation,
        Navigation,
        "#3b82f6",
        markers.current,
        roots.current,
      );
    }

    const points = [p, d, driverLocation].filter(isValidCoord);
    fitMapToPoints(mapInstance, points, mode);

    if (p && d) {
      if (mode === "EDIT") {
        try {
          (
            mapInstance.getSource("route-main") as maplibregl.GeoJSONSource
          )?.setData({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [p.lng, p.lat],
                [d.lng, d.lat],
              ],
            },
            properties: {},
          });
        } catch {
          /* ignore */
        }
      } else {
        fetchAndSetRoutes(
          mapInstance,
          p,
          d,
          controller,
          onRouteCalculatedRef.current,
        );
      }
    }

    return () => controller.abort();
  }, [
    isLoaded,
    mode,
    pickup,
    dropoff,
    departure,
    destination,
    driverLocation,
  ]);

  // TRACKING without an external driverLocation: ask once for browser GPS.
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !isLoaded) return;
    if (mode !== "TRACKING" || driverLocation) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
        };
        syncMarker(
          mapInstance,
          "driver",
          loc,
          Navigation,
          "#3b82f6",
          markers.current,
          roots.current,
        );
        mapInstance.setCenter([loc.lng, loc.lat]);
        mapInstance.setZoom(13);
      },
      () => {
        /* permission denied / unavailable */
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [isLoaded, mode, driverLocation]);

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-100"
      style={{ height }}
    >
      <div
        ref={(el) => {
          mapContainer.current = el;
        }}
        className="w-full h-full"
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
