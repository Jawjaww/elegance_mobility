"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import { Navigation, MapPin, LandPlot } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { getDirections } from "@/lib/services/directionsService";

interface Location {
  lat: number;
  lng: number;
}
interface RideRequestMapProps {
  pickup: Location;
  dropoff: Location;
  driverLocation?: Location | null;
  onReady?: () => void;
}

export function RideRequestMap({
  pickup,
  dropoff,
  driverLocation,
  onReady,
}: RideRequestMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const roots = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;
    const controller = new AbortController();

    // Init Map avec style vectoriel ultra-rapide
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [pickup.lng, pickup.lat],
      zoom: 12,
      attributionControl: false,
    });
    map.current = mapInstance;

    mapInstance.on("load", async () => {
      if (!map.current) return;

      // Sources
      mapInstance.addSource("route-client", {
        type: "geojson",
        lineMetrics: true,
        data: { type: "FeatureCollection", features: [] },
      });
      mapInstance.addSource("route-approach", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Layers (Glow + Main + Approach)
      mapInstance.addLayer({
        id: "route-approach-line",
        type: "line",
        source: "route-approach",
        paint: {
          "line-width": 3,
          "line-color": "#d6d6d6",
          "line-dasharray": [2, 2],
          "line-offset": 3,
          "line-opacity": 0.5,
        },
      });

      mapInstance.addLayer({
        id: "route-client-glow",
        type: "line",
        source: "route-client",
        paint: {
          "line-width": 9,
          "line-color": "#ffc38f",
          "line-blur": 8,
          "line-opacity": 0.2,
        },
      });

      mapInstance.addLayer({
        id: "route-client-main",
        type: "line",
        source: "route-client",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 3,
          "line-color": "#fda456",
        },
      });

      // Marqueurs
      const addMarker = (
        loc: Location,
        Icon: any,
        color: string,
        isDriver = false,
      ) => {
        const el = document.createElement("div");
        const root = createRoot(el);
        root.render(
          <div className="p-1.5 bg-white rounded-full shadow-xl border-2 border-white">
            <Icon
              size={isDriver ? 22 : 18}
              color={color}
              strokeWidth={3}
              fill={isDriver ? color : "none"}
            />
          </div>,
        );
        roots.current.push(root);
        new maplibregl.Marker({ element: el })
          .setLngLat([loc.lng, loc.lat])
          .addTo(mapInstance);
      };

      addMarker(pickup, MapPin, "#64748b");
      addMarker(dropoff, LandPlot, "#10b981");
      if (driverLocation)
        addMarker(driverLocation, Navigation, "#3b82f6", true);

      // --- CALCUL DU ZOOM ET DES TRACÉS ---
      const bounds = new maplibregl.LngLatBounds();
      bounds
        .extend([pickup.lng, pickup.lat])
        .extend([dropoff.lng, dropoff.lat]);
      if (driverLocation)
        bounds.extend([driverLocation.lng, driverLocation.lat]);

      // Ajustement Mobile Agressif
      const isMobile = window.innerHeight < 750;
      mapInstance.fitBounds(bounds, {
        // On force un padding énorme en haut/bas pour dégager l'UI de la modal
        padding: isMobile ? { top: 30, bottom: 80, left: 40, right: 40 } : 80,
        animate: false,
        maxZoom: 14, // Empêche d'être trop près sur les micro-trajets
      });

      // Chargement asynchrone des tracés côté client (CSR / Tauri-ready)
      (async () => {
        try {
          const clientData = await getDirections({
            start: { lng: pickup.lng, lat: pickup.lat },
            end: { lng: dropoff.lng, lat: dropoff.lat },
          });
          let approachData = null;
          if (driverLocation) {
            try {
              approachData = await getDirections({
                start: { lng: driverLocation.lng, lat: driverLocation.lat },
                end: { lng: pickup.lng, lat: pickup.lat },
              });
            } catch (e) {
              approachData = null;
            }
          }

          if (clientData?.features?.[0])
            (mapInstance.getSource("route-client") as any).setData(clientData);
          if (approachData?.features?.[0])
            (mapInstance.getSource("route-approach") as any).setData(
              approachData,
            );
        } catch (e) {
          console.warn("[RideRequestMap] getDirections failed", e);
        }
      })();

      setIsReady(true);
      onReady?.();
    });

    return () => {
      controller.abort();
      const currentRoots = [...roots.current];
      setTimeout(() => currentRoots.forEach((r) => r.unmount()), 0);
      mapInstance.remove();
    };
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  return (
    <div className="relative w-full h-full min-h-[300px] bg-gray-100">
      <div ref={mapContainer} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
