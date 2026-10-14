import { STL_DROP_INS, type DayKey, type DropInCenter } from './stlDropIns';

export type DayFilter = 'any' | DayKey;

export interface HygieneResult {
  center: DropInCenter;
  distanceMiles: number;
  openOnDay: boolean | null; // true/false if known, null if unposted
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

function openOn(center: DropInCenter, day: DayFilter): boolean | null {
  if (day === 'any') return null;
  if (center.hours.openDays === null) return null;
  return center.hours.openDays.includes(day);
}

export function findHygieneNear(
  coords: { latitude: number; longitude: number },
  options: { day?: DayFilter } = {}
): HygieneResult[] {
  const day = options.day ?? 'any';
  const results = STL_DROP_INS.map((c) => ({
    center: c,
    distanceMiles: haversineMiles(coords, c),
    openOnDay: openOn(c, day),
  }));
  // Hide only providers KNOWN to be closed on the chosen day; keep unknowns visible.
  const filtered = day === 'any' ? results : results.filter((r) => r.openOnDay !== false);
  return filtered.sort((a, b) => a.distanceMiles - b.distanceMiles);
}
