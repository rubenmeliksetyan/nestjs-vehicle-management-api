import { haversineDistanceKm } from './haversine';

describe('haversineDistanceKm', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistanceKm(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('returns positive distance for two different points', () => {
    const d = haversineDistanceKm(40.7128, -74.006, 40.7589, -73.9851);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(10);
  });

  it('returns ~10km for points about 10km apart', () => {
    const d = haversineDistanceKm(40.7128, -74.006, 40.7128, -73.8977);
    expect(d).toBeGreaterThan(9);
    expect(d).toBeLessThan(12);
  });
});
