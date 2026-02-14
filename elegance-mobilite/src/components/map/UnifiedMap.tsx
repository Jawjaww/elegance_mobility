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
  const roots = useRef<Map<string, any>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // helpers moved to map-helpers/*

  useEffect(() => {
    if (!mapContainer.current) return;
    const controller = new AbortController();

    // normalize coordinates: prefer new shape, fallback to legacy departure/destination
    const p: Coord | undefined =
      pickup ??
      (departure ? { lat: departure.lat, lng: departure.lon } : undefined);
    const d: Coord | undefined =
      dropoff ??
      (destination
        ? { lat: destination.lat, lng: destination.lon }
        : undefined);

    // Default center: prefer driver location, then pickup/dropoff, otherwise Paris
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

      // Only sync markers when we have valid coords
      if (p) {
        syncMarker(
          mapInstance,
          "pickup",
          p,
          MapPin,
          "#64748b",
          markers.current,
          roots.current,
        );
      }
      if (d) {
        syncMarker(
          mapInstance,
          "dropoff",
          d,
          mode === "EDIT" ? Flag : LandPlot,
          "#10b981",
          markers.current,
          roots.current,
        );
      }
      if (driverLocation) {
        syncMarker(
          mapInstance,
          "driver",
          driverLocation,
          Navigation,
          "#3b82f6",
          markers.current,
          roots.current,
        );
      } else if (
        mode === "TRACKING" &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        // Ask for permission once to center the dashboard map to current position (prompts the browser)
        try {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                heading: pos.coords.heading ?? undefined,
              };
              try {
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
              } catch (e) {
                // ignore marker errors
              }
            },
            (err) => {
              // user denied or unavailable — keep default center
              // do not spam console
            },
            { enableHighAccuracy: true, timeout: 10000 },
          );
        } catch (e) {
          // navigator may be unavailable in some environments
        }
      }

      // Fit bounds responsive when we have at least two points; otherwise keep initial center/zoom
      const coords: Array<[number, number]> = [];
      if (p) coords.push([p.lng, p.lat]);
      if (d) coords.push([d.lng, d.lat]);
      if (driverLocation) coords.push([driverLocation.lng, driverLocation.lat]);

      const isShort =
        typeof globalThis.window !== "undefined" &&
        globalThis.window.innerHeight <= 700;
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
      } else if (coords.length === 1) {
        mapInstance.setCenter(coords[0]);
        mapInstance.setZoom(13);
      } else {
        // no points -> keep Paris/initialCenter
        mapInstance.setCenter(initialCenter);
        mapInstance.setZoom(initialZoom);
      }

      if (mode !== "EDIT") {
        // Only fetch route when both endpoints are available
        if (p && d)
          fetchAndSetRoutes(mapInstance, p, d, controller, onRouteCalculated);
      } else {
        // In EDIT mode we draw a straight line only when both endpoints exist
        if (p && d) {
          try {
            (mapInstance.getSource("route-main") as any).setData({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [p.lng, p.lat],
                  [d.lng, d.lat],
                ],
              },
            });
          } catch (e) {
            // ignore
          }
        }
      }

      setIsLoaded(true);
      onReady?.();
    });

    return () => {
      controller.abort();
      // Unmount roots safely in next microtask to avoid sync unmount during render
      try {
        queueMicrotask(() => {
          roots.current.forEach((r) => {
            try {
              r.unmount();
            } catch {}
          });
        });
      } catch (e) {
        setTimeout(() => {
          roots.current.forEach((r) => {
            try {
              r.unmount();
            } catch {}
          });
        }, 0);
      }
      try {
        mapInstance.remove();
      } catch (e) {}
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(pickup ?? departure ?? {}),
    JSON.stringify(dropoff ?? destination ?? {}),
    mode,
  ]);

  // Update driver marker without remounting the map when location changes
  useEffect(() => {
    if (!map.current || !driverLocation) return;
    try {
      syncMarker(
        map.current,
        "driver",
        driverLocation,
        Navigation,
        "#3b82f6",
        markers.current,
        roots.current,
      );
    } catch (e) {}
  }, [driverLocation]);

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-100"
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
