"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/map.css';
import mapRegistry, { MAX_ACTIVE_MAPS } from './mapRegistry';
import { Location } from '@/lib/types/map-types';
import { getDirections } from '@/lib/services/directionsService';

interface RideRequestMapProps {
  departure: Location | null;
  destination: Location | null;
  onRouteCalculated?: (distance: number, duration: number) => void;
  enableRouting?: boolean;
  className?: string;
}

export default function RideRequestMap({ departure, destination, onRouteCalculated, enableRouting = true, className = 'h-96' }: RideRequestMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapIdRef = useRef<string>(`ride-map-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const routeTracedRef = useRef<string | null>(null);

  const cleanupMap = useCallback(() => {
    if (mapRef.current) {
      try {
        mapRegistry.unregister(mapIdRef.current);
        // remove markers
        mapRef.current.getContainer().querySelectorAll('.maplibregl-marker').forEach(m => m.remove());
        try {
          if (mapRef.current.getSource('route')) {
            if (mapRef.current.getLayer('route-line')) mapRef.current.removeLayer('route-line');
            mapRef.current.removeSource('route');
          }
        } catch (e) {}
        mapRef.current.remove();
      } catch (e) {
        console.warn('Error cleaning map:', e);
      } finally {
        mapRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    mapRegistry.forceCleanupOldest();

    if (!containerRef.current || mapRef.current) return;
    if (!departure && !destination) return;

    const initialCenter: [number, number] = departure ? [departure.lon, departure.lat] : destination ? [destination.lon, destination.lat] : [2.3488, 48.8534];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: { stadia: { type: 'vector', url: 'https://tiles.stadiamaps.com/data/openmaptiles.json' } },
        layers: [],
      } as any,
      center: initialCenter,
      zoom: 12,
      attributionControl: false,
      maxZoom: 18,
    });

    map.on('load', () => {
      mapRef.current = map;
      setStyleLoaded(true);
      try {
        map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#0078d4', 'line-width': 6 } });
      } catch (e) {
        console.warn('Error adding route source/layer', e);
      }

      mapRegistry.register(mapIdRef.current, map);
      mapRegistry.ensureSingleInstance(mapIdRef.current);
    });

    return () => cleanupMap();
  }, [containerRef, departure, destination, cleanupMap]);

  const fetchAndDisplayRoute = useCallback(async (dep: Location, dest: Location) => {
    if (!mapRef.current || !styleLoaded || !enableRouting) return;
    const routeKey = `${dep.lat},${dep.lon}-${dest.lat},${dest.lon}`;
    if (routeTracedRef.current === routeKey) return;

    try {
      const data = await getDirections({ start: { lng: dep.lon, lat: dep.lat }, end: { lng: dest.lon, lat: dest.lat } });
      if (data.features && data.features.length > 0) {
        const route = data.features[0];
        const coords = route.geometry.coordinates;
        const distance = route.properties.summary.distance;
        const duration = route.properties.summary.duration;

        const source = mapRef.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
          if (coords && coords.length > 1) {
            const bounds = new maplibregl.LngLatBounds();
            coords.forEach((c) => {
              const [lon, lat] = c as [number, number];
              bounds.extend([lon, lat]);
            });
            mapRef.current.fitBounds(bounds, { padding: { top: 80, bottom: 80, left: 120, right: 120 }, maxZoom: 16, duration: 0 });
            routeTracedRef.current = routeKey;
          }

          let finalDistance = distance;
          let finalDuration = duration;
          const straightDist = Math.hypot(dep.lat - dest.lat, dep.lon - dest.lon) * 111000; // rough
          if (straightDist > 5000 && distance < straightDist * 0.6) {
            finalDistance = Math.round(straightDist);
            finalDuration = Math.round(finalDistance / (80 / 3.6));
          }

          onRouteCalculated?.(finalDistance, finalDuration);
        }
      }
    } catch (e) {
      console.error('Error fetching route', e);
    }
  }, [styleLoaded, enableRouting, onRouteCalculated]);

  useEffect(() => {
    if (mapRef.current && styleLoaded && departure && destination && enableRouting) {
      fetchAndDisplayRoute(departure, destination);
    }
  }, [departure, destination, styleLoaded, fetchAndDisplayRoute, enableRouting]);

  // Resize handling
  useEffect(() => {
    if (!mapRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [styleLoaded]);

  return <div ref={containerRef} className={`w-full ${className} map-container map-instance-${mapIdRef.current}`} data-testid="ride-request-map" />;
}
