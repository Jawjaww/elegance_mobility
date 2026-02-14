import maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";

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

    const el = document.createElement("div");
    const root = createRoot(el);
    // pickup / dropoff markers get a semi-transparent background for better contrast
    const isDriver = id === "driver";
    const bgStyle: any = isDriver
      ? {
          backgroundColor: "#ffffff",
          border: "2px solid #ffffff",
          boxShadow: "0 6px 18px rgba(2,6,23,0.12)",
        }
      : {
          backgroundColor: "rgba(255,255,255,0.65)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 6px 18px rgba(2,6,23,0.06)",
        };

    root.render(
      <div
        style={{
          padding: 6,
          borderRadius: 9999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transform: isDriver ? `rotate(${loc.heading || 0}deg)` : "none",
          ...bgStyle,
        }}
      >
        <Icon
          size={isDriver ? 22 : 26}
          color={color}
          strokeWidth={isDriver ? 3 : 1.5}
          fill={isDriver ? color : "none"}
        />
      </div>,
    );

    const marker = new maplibregl.Marker({
      element: el,
      anchor: id === "driver" ? "center" : "bottom",
    })
      .setLngLat([loc.lng, loc.lat])
      .addTo(mapInstance);

    markers.set(id, marker);
    roots.set(id, root);
  } catch (e) {
    console.warn("[map-helpers] syncMarker error", e);
  }
}
