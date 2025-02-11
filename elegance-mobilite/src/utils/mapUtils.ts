import L from "leaflet";

export function createCustomIcon(color: "blue" | "red") {
  const baseColor = color === "blue" ? "from-blue-500 to-blue-700" : "from-red-500 to-red-700";
  
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="marker-pin bg-gradient-to-r ${baseColor}"></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
}

export function createCustomMarker(
  latLng: L.LatLng,
  title: string,
  colorClass: string
): L.Marker {
  const marker = L.marker(latLng, {
    icon: L.divIcon({
      className: `custom-marker ${colorClass}`,
      html: `<div class="marker-content">${title}</div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    })
  });
  marker.bindPopup(title);
  return marker;
}

export function updateLeafletContainer(map: L.Map): void {
  // Force le recalcul de la taille du conteneur de la carte
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}