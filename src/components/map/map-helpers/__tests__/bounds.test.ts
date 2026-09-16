import {
  bearingDegrees,
  computeFitSpanKm,
  geoDistanceMeters,
  resolveFitMaxZoom,
} from "../mapFitMath";

describe("resolveFitMaxZoom", () => {
  it("allows tighter zoom under 5 km", () => {
    expect(resolveFitMaxZoom(3, false)).toBe(14);
    expect(resolveFitMaxZoom(1, true)).toBe(15);
  });

  it("keeps default cap on longer spans", () => {
    expect(resolveFitMaxZoom(20, false)).toBe(13);
    expect(resolveFitMaxZoom(20, true)).toBe(12);
  });
});

describe("computeFitSpanKm", () => {
  it("returns max pairwise distance in km", () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const nearby = { lat: 48.86, lng: 2.36 };
    const span = computeFitSpanKm([paris, nearby]);
    expect(span).toBeGreaterThan(0);
    expect(span).toBeLessThan(2);
  });
});

describe("geoDistanceMeters", () => {
  it("matches haversine order of magnitude", () => {
    const m = geoDistanceMeters(
      { lat: 48.85, lng: 2.35 },
      { lat: 48.86, lng: 2.35 },
    );
    expect(m).toBeGreaterThan(1000);
    expect(m).toBeLessThan(1500);
  });
});

describe("bearingDegrees", () => {
  const origin = { lat: 48.85, lng: 2.35 };

  it("reads 0 due north and 90 due east", () => {
    expect(bearingDegrees(origin, { lat: 48.86, lng: 2.35 })).toBeCloseTo(0, 0);
    expect(bearingDegrees(origin, { lat: 48.85, lng: 2.36 })).toBeCloseTo(90, 0);
  });

  it("reads 180 due south and 270 due west", () => {
    expect(bearingDegrees(origin, { lat: 48.84, lng: 2.35 })).toBeCloseTo(180, 0);
    expect(bearingDegrees(origin, { lat: 48.85, lng: 2.34 })).toBeCloseTo(270, 0);
  });

  it("always returns a compass value in [0, 360)", () => {
    const samples = [
      { lat: 48.80, lng: 2.45 },
      { lat: 48.90, lng: 2.25 },
      { lat: 48.845, lng: 2.359 },
    ];
    for (const target of samples) {
      const bearing = bearingDegrees(origin, target);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    }
  });
});
