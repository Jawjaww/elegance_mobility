export type MapCoord = { lat: number; lng: number };

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Rough great-circle distance in meters between two coords. */
export function geoDistanceMeters(a: MapCoord, b: MapCoord): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Max pairwise distance (km) among map fit points. */
export function computeFitSpanKm(coords: MapCoord[]): number {
  if (coords.length < 2) return 0;
  let maxM = 0;
  for (let i = 0; i < coords.length; i += 1) {
    for (let j = i + 1; j < coords.length; j += 1) {
      const d = geoDistanceMeters(coords[i], coords[j]);
      if (d > maxM) maxM = d;
    }
  }
  return maxM / 1000;
}

/**
 * Initial compass bearing (degrees, 0 = north, clockwise) from `a` to `b`.
 *
 * Used to orient the departure navigation glyph along the trip: a glyph drawn
 * pointing up needs a rotation equal to this bearing.
 */
export function bearingDegrees(a: MapCoord, b: MapCoord): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

/** Higher maxZoom on short spans so pickup, dropoff and driver stay visible. */
export function resolveFitMaxZoom(spanKm: number, compact: boolean): number {
  if (spanKm > 0 && spanKm < 2) return 15;
  if (spanKm >= 2 && spanKm < 5) return 14;
  if (spanKm >= 5 && spanKm < 15) return compact ? 12 : 13;
  return compact ? 12 : 13;
}
