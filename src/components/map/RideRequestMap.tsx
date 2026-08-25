"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/styles/map.css";
import mapRegistry from "./mapRegistry";
import mapStyle from "./mapStyle";
import { Location } from "@/lib/types/map-types";
import { getDirections } from "@/lib/services/directionsService";

interface RideRequestMapProps {
  departure: Location | null;
  destination: Location | null;
  onRouteCalculated?: (distance: number, duration: number) => void;
  enableRouting?: boolean;
  className?: string;
}

function isValidCoord(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLocation(
  loc: Location | null | undefined,
): loc is Location {
  return !!loc && isValidCoord(loc.lat) && isValidCoord(loc.lon);
}

function resolveInitialCenter(
  departure: Location | null,
  destination: Location | null,
): [number, number] {
  if (isValidLocation(departure)) return [departure.lon, departure.lat];
  if (isValidLocation(destination)) return [destination.lon, destination.lat];
  return [2.3488, 48.8534];
}

function removeRouteLayersAndSource(map: maplibregl.Map): void {
  if (!map.getSource("route")) return;
  if (map.getLayer("route-line")) map.removeLayer("route-line");
  if (map.getLayer("route-line-glow")) map.removeLayer("route-line-glow");
  map.removeSource("route");
}

function ensureRouteLayers(map: maplibregl.Map): void {
  if (!map.getSource("route")) {
    map.addSource("route", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!map.getLayer("route-line-glow")) {
    map.addLayer({
      id: "route-line-glow",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#b3d4ff",
        "line-width": 12,
        "line-opacity": 0.6,
      },
    });
  }
  if (!map.getLayer("route-line")) {
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#0078d4",
        "line-width": 6,
        "line-opacity": 1,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    });
  }
}

let rideMapIdCounter = 0;

function createRideMapId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi !== undefined && "randomUUID" in cryptoApi) {
    return `ride-map-${cryptoApi.randomUUID()}`;
  }
  rideMapIdCounter += 1;
  return `ride-map-${Date.now()}-${rideMapIdCounter}`;
}

export default function RideRequestMap({
  departure,
  destination,
  onRouteCalculated,
  enableRouting = true,
  className = "h-full",
}: Readonly<RideRequestMapProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapIdRef = useRef(createRideMapId());
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const routeTracedRef = useRef<string | null>(null);
  const markersRef = useRef<{
    departure?: maplibregl.Marker;
    destination?: maplibregl.Marker;
  }>({});

  onRouteCalculatedRef.current = onRouteCalculated;

  // Create the map once — do not remount when departure/destination object identity changes.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRegistry.forceCleanupOldest();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: resolveInitialCenter(departure, destination),
      zoom: 12,
      attributionControl: false,
      maxZoom: 18,
      dragRotate: false,
      pitchWithRotate: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      try {
        ensureRouteLayers(map);
      } catch (error) {
        console.warn("[RideRequestMap] Error adding route layers", error);
      }
      setStyleLoaded(true);
      mapRegistry.register(mapIdRef.current, map);
      mapRegistry.ensureSingleInstance(mapIdRef.current);
    });

    return () => {
      markersRef.current.departure?.remove();
      markersRef.current.destination?.remove();
      markersRef.current = {};
      try {
        mapRegistry.unregister(mapIdRef.current);
        removeRouteLayersAndSource(map);
        map.remove();
      } catch (error) {
        console.warn("[RideRequestMap] Error cleaning map:", error);
      } finally {
        mapRef.current = null;
        setStyleLoaded(false);
        routeTracedRef.current = null;
      }
    };
    // Initial center only; route/marker sync is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncMarker = useCallback(
    (key: "departure" | "destination", loc: Location | null, color: string) => {
      const map = mapRef.current;
      if (!map || !styleLoaded) return;

      markersRef.current[key]?.remove();
      delete markersRef.current[key];

      if (!isValidLocation(loc)) return;

      markersRef.current[key] = new maplibregl.Marker({ color })
        .setLngLat([loc.lon, loc.lat])
        .addTo(map);
    },
    [styleLoaded],
  );

  const fetchAndDisplayRoute = useCallback(
    async (dep: Location, dest: Location) => {
      const map = mapRef.current;
      if (!map || !styleLoaded || !enableRouting) return;

      const routeKey = `${dep.lat},${dep.lon}-${dest.lat},${dest.lon}`;
      if (routeTracedRef.current === routeKey) return;

      try {
        ensureRouteLayers(map);
        const data = await getDirections({
          start: { lng: dep.lon, lat: dep.lat },
          end: { lng: dest.lon, lat: dest.lat },
        });
        if (!data.features?.length) return;

        const route = data.features[0];
        const coords = route.geometry.coordinates as [number, number][];
        const distance = route.properties.summary.distance;
        const duration = route.properties.summary.duration;

        const source = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
        if (!source) return;

        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });

        if (coords.length > 1) {
          const bounds = new maplibregl.LngLatBounds();
          coords.forEach(([lon, lat]) => {
            bounds.extend([lon, lat]);
          });
          map.resize();
          requestAnimationFrame(() => {
            mapRef.current?.fitBounds(bounds, {
              padding: { top: 80, bottom: 80, left: 120, right: 120 },
              maxZoom: 16,
              duration: 300,
            });
          });
          routeTracedRef.current = routeKey;
        }

        let finalDistance = distance;
        let finalDuration = duration;
        const straightDist =
          Math.hypot(dep.lat - dest.lat, dep.lon - dest.lon) * 111000;
        if (straightDist > 5000 && distance < straightDist * 0.6) {
          finalDistance = Math.round(straightDist);
          finalDuration = Math.round(finalDistance / (80 / 3.6));
        }

        onRouteCalculatedRef.current?.(finalDistance, finalDuration);
      } catch (error) {
        console.error("[RideRequestMap] Error fetching route", error);
      }
    },
    [styleLoaded, enableRouting],
  );

  // Sync markers + route without remounting the map.
  useEffect(() => {
    if (!mapRef.current || !styleLoaded) return;

    syncMarker("departure", departure, "#22c55e");
    syncMarker("destination", destination, "#ef4444");

    if (enableRouting && isValidLocation(departure) && isValidLocation(destination)) {
      void fetchAndDisplayRoute(departure, destination);
      return;
    }

    try {
      const source = mapRef.current.getSource("route") as
        | maplibregl.GeoJSONSource
        | undefined;
      source?.setData({ type: "FeatureCollection", features: [] });
      routeTracedRef.current = null;
    } catch (error) {
      console.warn("[RideRequestMap] Could not clear route source", error);
    }
  }, [
    departure,
    destination,
    styleLoaded,
    enableRouting,
    syncMarker,
    fetchAndDisplayRoute,
  ]);

  useEffect(() => {
    if (!mapRef.current || !styleLoaded || !containerRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(containerRef.current);
    mapRef.current.resize();
    return () => ro.disconnect();
  }, [styleLoaded]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[12rem] ${className} map-container map-instance-${mapIdRef.current}`}
      data-testid="ride-request-map"
    />
  );
}
