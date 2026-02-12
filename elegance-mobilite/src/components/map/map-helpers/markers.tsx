import maplibregl from 'maplibre-gl';
import { createRoot } from 'react-dom/client';

export interface IconLike {
  (props: any): any;
}

export function syncMarker(
  mapInstance: maplibregl.Map,
  id: string,
  loc: { lat: number; lng: number; heading?: number },
  Icon: any,
  color: string,
  markers: Map<string, maplibregl.Marker>,
  roots: Map<string, any>,
) {
  try {
    if (markers.has(id)) {
      markers.get(id)!.setLngLat([loc.lng, loc.lat]);
      return;
    }

    const el = document.createElement('div');
    const root = createRoot(el);
    root.render(
      <div
        className="p-1.5 bg-white rounded-full shadow-xl border-2 border-white"
        style={{ transform: id === 'driver' ? `rotate(${loc.heading || 0}deg)` : 'none' }}
      >
        <Icon size={id === 'driver' ? 22 : 18} color={color} strokeWidth={3} fill={id === 'driver' ? color : 'none'} />
      </div>,
    );

    const marker = new maplibregl.Marker({ element: el, anchor: id === 'driver' ? 'center' : 'bottom' })
      .setLngLat([loc.lng, loc.lat])
      .addTo(mapInstance);

    markers.set(id, marker);
    roots.set(id, root);
  } catch (e) {
    console.warn('[map-helpers] syncMarker error', e);
  }
}
