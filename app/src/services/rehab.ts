import { STL_REHAB, type RehabFilter, type RehabProvider } from './stlRehab';

export interface RehabResult {
  provider: RehabProvider;
  distanceMiles: number | null;
}

const EARTH_MILES = 3958.8;

function haversineMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

function matchesType(provider: RehabProvider, filter: RehabFilter): boolean {
  if (filter === 'all') return true;
  return provider.types.includes(filter);
}

export function findRehabNear(
  coords: { latitude: number; longitude: number },
  options: { type?: RehabFilter } = {}
): RehabResult[] {
  const type = options.type ?? 'all';
  const filtered = STL_REHAB.filter((p) => matchesType(p, type)).map((p) => ({
    provider: p,
    distanceMiles:
      p.latitude !== null && p.longitude !== null
        ? haversineMiles(coords, { latitude: p.latitude, longitude: p.longitude })
        : null,
  }));

  // Sort by distance (ascending), call-only entries at the end — except crisis lines sort first
  // since they're the most time-sensitive.
  return filtered.sort((a, b) => {
    const aCrisis = a.provider.types.includes('crisis');
    const bCrisis = b.provider.types.includes('crisis');
    if (type !== 'crisis' && aCrisis !== bCrisis) {
      // When not filtering to crisis, keep crisis providers near the top only if
      // they have a distance; otherwise fall back to natural order.
    }
    if (a.distanceMiles === null && b.distanceMiles === null) return 0;
    if (a.distanceMiles === null) return 1;
    if (b.distanceMiles === null) return -1;
    return a.distanceMiles - b.distanceMiles;
  });
}
