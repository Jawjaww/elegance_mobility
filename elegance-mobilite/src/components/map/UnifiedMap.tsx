"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import { Navigation, MapPin, LandPlot, Flag } from "lucide-react";
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
      // Sources
      if (!mapInstance.getSource("route-main"))
        mapInstance.addSource("route-main", {
          type: "geojson",
          lineMetrics: true,
          data: { type: "FeatureCollection", features: [] },
        });
      if (!mapInstance.getSource("route-alt"))
        mapInstance.addSource("route-alt", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

      // Approach / alt layer
      if (!mapInstance.getLayer("line-alt")) {
        mapInstance.addLayer({
          id: "line-alt",
          type: "line",
          source: "route-alt",
          paint: {
            "line-width": 3,
            "line-color": "#94a3b8",
            "line-opacity": 0.5,
            "line-dasharray": [2, 2],
            "line-offset": mode === "REQUEST" ? 3 : 0,
          },
        });
      }

      // Glow layer for REQUEST
      if (mode === "REQUEST" && !mapInstance.getLayer("line-glow")) {
        mapInstance.addLayer({
          id: "line-glow",
          type: "line",
          source: "route-main",
          paint: {
            "line-width": 12,
            "line-color": "#10b981",
            "line-blur": 10,
            "line-opacity": 0.2,
          },
        });
      }

      // Main line
      if (!mapInstance.getLayer("line-main")) {
        mapInstance.addLayer({
          id: "line-main",
          type: "line",
          source: "route-main",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 5,
            "line-color": mode === "REQUEST" ? "#10b981" : "#3b82f6",
          },
        });
      }

      // Helper to add/update marker
      const syncMarker = (
        id: string,
        loc: { lat: number; lng: number; heading?: number },
        Icon: any,
        color: string,
      ) => {
        try {
          if (markers.current.has(id)) {
            markers.current.get(id)!.setLngLat([loc.lng, loc.lat]);
            return;
          }

          const el = document.createElement("div");
          const root = createRoot(el);
          root.render(
            <div
              className="p-1.5 bg-white rounded-full shadow-xl border-2 border-white"
              style={{
                transform:
                  id === "driver" ? `rotate(${loc.heading || 0}deg)` : "none",
              }}
            >
              <Icon
                size={id === "driver" ? 22 : 18}
                color={color}
                strokeWidth={3}
                fill={id === "driver" ? color : "none"}
              />
            </div>,
          );

          const marker = new maplibregl.Marker({
            element: el,
            anchor: id === "driver" ? "center" : "bottom",
          })
            .setLngLat([loc.lng, loc.lat])
            .addTo(mapInstance);

          markers.current.set(id, marker);
          roots.current.set(id, root);
        } catch (e) {
          console.warn("[UnifiedMap] syncMarker error", e);
        }
      };

      syncMarker("pickup", p, MapPin, "#64748b");
      syncMarker("dropoff", d, mode === "EDIT" ? Flag : LandPlot, "#10b981");
      if (driverLocation)
        syncMarker("driver", driverLocation, Navigation, "#3b82f6");

      // Fit bounds responsive
      const bounds = new maplibregl.LngLatBounds()
        .extend([p.lng, p.lat])
        .extend([d.lng, d.lat]);
      if (driverLocation)
        bounds.extend([driverLocation.lng, driverLocation.lat]);

      const isShort =
        typeof window !== "undefined" && window.innerHeight <= 700;
      mapInstance.fitBounds(bounds, {
        padding: isShort ? { top: 40, bottom: 120, left: 40, right: 40 } : 80,
        animate: mode === "TRACKING",
        maxZoom: 15,
      });

      // Data fetching
      if (mode !== "EDIT") {
        const url = (s: any, e: any) =>
          `/api/directions?start=${s.lng},${s.lat}&end=${e.lng},${e.lat}`;
        Promise.all([
          fetch(url(p, d), { signal: controller.signal })
            .then((r) => r.json())
            .catch(() => null),
          driverLocation
            ? fetch(url(driverLocation, p), { signal: controller.signal })
                .then((r) => r.json())
                .catch(() => null)
            : Promise.resolve(null),
        ])
          .then(([main, alt]) => {
            try {
              if (main?.features?.[0])
                (mapInstance.getSource("route-main") as any).setData(main);
            } catch (e) {}
            try {
              if (main?.features?.[0]) {
                (mapInstance.getSource("route-main") as any).setData(main);
                // Extract distance/duration if available and notify parent
                try {
                  const route = main.features[0];
                  const distance =
                    route.properties?.summary?.distance ??
                    route.properties?.distance ??
                    null;
                  const duration =
                    route.properties?.summary?.duration ??
                    route.properties?.duration ??
                    null;
                  if (
                    typeof distance === "number" &&
                    typeof duration === "number"
                  ) {
                    // Call callback if provided
                    if (onRouteCalculated) {
                      onRouteCalculated(distance, duration);
                    }
                  }
                } catch (e) {}
              }
            } catch (e) {}
            try {
              if (alt?.features?.[0])
                (mapInstance.getSource("route-alt") as any).setData(alt);
            } catch (e) {}
          })
          .catch(() => null);
      } else {
        // EDIT: line direct
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
