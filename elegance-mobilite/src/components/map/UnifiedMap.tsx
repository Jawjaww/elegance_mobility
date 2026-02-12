"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import { Navigation, MapPin, LandPlot, Flag } from "lucide-react";
import { syncMarker } from "./map-helpers/markers";
import { ensureSourcesAndLayers } from "./map-helpers/sources";
import { fetchAndSetRoutes } from "./map-helpers/routes";
import "maplibre-gl/dist/maplibre-gl.css";

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
  mode: MapMode;
  pickup?: Coord;
  dropoff?: Coord;
  // Legacy props compatibility
  departure?: LegacyLocation | null;
  destination?: LegacyLocation | null;
  driverLocation?: DriverCoord | null;
  onReady?: () => void;
  onRouteCalculated?: (distance: number, duration: number) => void;
  height?: string;
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
    const p: Coord =
      pickup ??
      (departure
        ? { lat: departure.lat, lng: departure.lon }
        : { lat: 0, lng: 0 });
    const d: Coord =
      dropoff ??
      (destination
        ? { lat: destination.lat, lng: destination.lon }
        : { lat: 0, lng: 0 });

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [p.lng, p.lat],
      zoom: 13,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.current = mapInstance;

    mapInstance.on("load", () => {

      ensureSourcesAndLayers(mapInstance, mode);

      syncMarker(mapInstance, "pickup", p, MapPin, "#64748b", markers.current, roots.current);
      syncMarker(mapInstance, "dropoff", d, mode === "EDIT" ? Flag : LandPlot, "#10b981", markers.current, roots.current);
      if (driverLocation) syncMarker(mapInstance, "driver", driverLocation, Navigation, "#3b82f6", markers.current, roots.current);

      // Fit bounds responsive
      const bounds = new maplibregl.LngLatBounds().extend([p.lng, p.lat]).extend([d.lng, d.lat]);
      if (driverLocation) bounds.extend([driverLocation.lng, driverLocation.lat]);

      const isShort = typeof window !== "undefined" && window.innerHeight <= 700;
      mapInstance.fitBounds(bounds, {
        padding: isShort ? { top: 40, bottom: 120, left: 40, right: 40 } : 80,
        animate: mode === "TRACKING",
        maxZoom: 15,
      });

      if (mode !== "EDIT") {
        fetchAndSetRoutes(mapInstance, p, d, controller, onRouteCalculated);
      } else {
        try {
          (mapInstance.getSource("route-main") as any).setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[p.lng, p.lat], [d.lng, d.lat]] },
          });
        } catch (e) {}
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
    JSON.stringify(driverLocation ?? null),
    mode,
  ]);

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
