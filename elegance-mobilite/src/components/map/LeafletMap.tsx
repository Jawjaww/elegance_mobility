"use client";

import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet.awesome-markers";
import type { MapMarker } from "@/lib/types";

interface LeafletMapProps {
  markers: MapMarker[];
  initialZoom?: number;
  initialCenter?: L.LatLngExpression;
  enableRouting?: boolean;
  onRouteCalculated?: (distance: number, duration: number) => void;
  onMarkerDrag?: (index: number, position: L.LatLng) => void;
  onMarkerDragEnd?: (index: number, position: L.LatLng) => void;
  className?: string;
}

// Production OSRM server URL (to be configured using environment variable)
const OSRM_SERVER = process.env.NEXT_PUBLIC_OSRM_SERVER || 'https://router.project-osrm.org';

const LeafletMap: React.FC<LeafletMapProps> = ({
  markers,
  initialZoom = 13,
  initialCenter = [48.8566, 2.3522] as L.LatLngExpression,
  enableRouting = false,
  onRouteCalculated,
  onMarkerDrag,
  onMarkerDragEnd,
  className = "",
}) => {
  const mapInstance = useRef<L.Map | null>(null);
  const markerRefs = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const mapContainerId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (routeLayerRef.current) {
      try {
        mapInstance.current?.removeLayer(routeLayerRef.current);
      } catch (e) {
        console.warn('Error removing route layer:', e);
      }
      routeLayerRef.current = null;
    }

    markerRefs.current.forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        console.warn('Error removing marker:', e);
      }
    });
    markerRefs.current = [];

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
  }, []);

  // Calculate route using OSRM
  const calculateRoute = useCallback(async (start: L.LatLng, end: L.LatLng) => {
    // Clean up existing route if any
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    try {
      const response = await fetch(
        `${OSRM_SERVER}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      
      if (routeLayerRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(routeLayerRef.current);
      }

      if (mapInstance.current) {
        routeLayerRef.current = L.polyline(coordinates, {
          color: '#6366f1',
          opacity: 0.6,
          weight: 4
        }).addTo(mapInstance.current);
      }

      // Convert distance (m) and duration (s) to usable values
      const distance = route.distance; // in meters
      const duration = route.duration; // in seconds
      onRouteCalculated?.(distance, duration);

    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback to a simple line if route calculation fails
      if (mapInstance.current) {
        const fallbackLine = L.polyline([start, end], {
          color: '#6366f1',
          opacity: 0.6,
          weight: 4
        }).addTo(mapInstance.current);
        routeLayerRef.current = fallbackLine;
      }

      // Calculate distance and duration using a straight line
      const distance = start.distanceTo(end);
      const averageSpeedMps = (50 * 1000) / 3600; // 50 km/h in m/s
      const duration = Math.round(distance / averageSpeedMps);
      onRouteCalculated?.(distance, duration);
    }
  }, [onRouteCalculated]);

  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainerId.current, {
        center: initialCenter,
        zoom: initialZoom,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance.current);
    }

    // Cleanup existing markers
    markerRefs.current = [];
    if (mapInstance.current) {
      mapInstance.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          layer.remove();
        }
      });
    }

    // Add new markers
    markers.forEach((markerData, index) => {
      const marker = L.marker(markerData.position, {
        draggable: markerData.draggable ?? false,
        icon: L.AwesomeMarkers.icon({
          icon: markerData.icon || "map-marker",
          markerColor: markerData.color || (index === 0 ? "darkgreen" : "red"),
          prefix: "fa",
        }),
      });

      if (markerData.draggable) {
        marker.on("drag", (e) => {
          const { lat, lng } = (e.target as L.Marker).getLatLng();
          onMarkerDrag?.(index, L.latLng(lat, lng));
        });

        marker.on("dragend", (e) => {
          const { lat, lng } = (e.target as L.Marker).getLatLng();
          onMarkerDragEnd?.(index, L.latLng(lat, lng));
        });
      }

      marker.bindPopup(markerData.address);
      if (mapInstance.current) {
        marker.addTo(mapInstance.current);
      }
      markerRefs.current.push(marker);
    });

    // Calculate route if needed
    if (mapInstance.current) {
      if (enableRouting && markers.length === 2) {
        const start = L.latLng(markers[0].position);
        const end = L.latLng(markers[1].position);
        calculateRoute(start, end);
      } else {
        // Remove route if no longer needed
        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }
      }
    }

    // Ajust view to show the marker(s)
    // Ajust with a small delay to let the map stabilize
    if (markers.length > 0 && mapInstance.current) {
      const timeoutId = setTimeout(() => {
        if (mapInstance.current) {
          if (markers.length === 1) {
            // For a single marker, center the view on it
            mapInstance.current.setView(markers[0].position, 15);
          } else {
            // For multiple markers, fit the view to show all of them
            const bounds = L.latLngBounds(
              markers.map((marker) => L.latLng(marker.position))
            );
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      }, 100); // Delay in milliseconds

      // Cleanup timeout
      return () => clearTimeout(timeoutId);
    }

    return cleanup;
  }, [
    markers,
    initialZoom,
    initialCenter,
    enableRouting,
    onMarkerDrag,
    onMarkerDragEnd,
    calculateRoute,
    cleanup
  ]);

  return <div id={mapContainerId.current} className={`h-[400px] ${className}`} />;
};

export default LeafletMap;
