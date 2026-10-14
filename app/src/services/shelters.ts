import type { DayFilter } from './hygiene';
import { STL_SHELTERS, type ShelterAudience, type ShelterProvider } from './stlShelters';

export type AudienceFilter = 'all' | ShelterAudience;

export interface ShelterResult {
  provider: ShelterProvider;
  distanceMiles: number | null;
  openOnDay: boolean | null;
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

function matchesAudience(provider: ShelterProvider, filter: AudienceFilter): boolean {
  if (filter === 'all') return true;
  if (provider.audience === 'all') return true;
  return provider.audience === filter;
}

function openOn(provider: ShelterProvider, day: DayFilter): boolean | null {
  if (day === 'any') return null;
  if (provider.hours.openDays === null) return null;
  return provider.hours.openDays.includes(day);
}

export function findSheltersNear(
  coords: { latitude: number; longitude: number },
  options: { audience?: AudienceFilter; day?: DayFilter } = {}
): ShelterResult[] {
  const audience = options.audience ?? 'all';
  const day = options.day ?? 'any';

  const filtered = STL_SHELTERS.filter((p) => matchesAudience(p, audience)).map((p) => ({
    provider: p,
    distanceMiles:
      p.latitude !== null && p.longitude !== null
        ? haversineMiles(coords, { latitude: p.latitude, longitude: p.longitude })
        : null,
    openOnDay: openOn(p, day),
  }));

  const kept = day === 'any' ? filtered : filtered.filter((r) => r.openOnDay !== false);

  // Sort: known distance first (ascending), then call-only entries (null distance) at the end.
  return kept.sort((a, b) => {
    if (a.distanceMiles === null && b.distanceMiles === null) return 0;
    if (a.distanceMiles === null) return 1;
    if (b.distanceMiles === null) return -1;
    return a.distanceMiles - b.distanceMiles;
  });
}
