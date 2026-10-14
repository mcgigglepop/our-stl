import type { DayFilter } from './hygiene';
import { STL_PANTRIES, type Pantry } from './stlPantries';

export interface PantryResult {
  pantry: Pantry;
  distanceMiles: number;
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

function openOn(pantry: Pantry, day: DayFilter): boolean | null {
  if (day === 'any') return null;
  if (pantry.hours.openDays === null) return null;
  return pantry.hours.openDays.includes(day);
}

export function findPantriesNear(
  coords: { latitude: number; longitude: number },
  options: { day?: DayFilter } = {}
): PantryResult[] {
  const day = options.day ?? 'any';
  const results = STL_PANTRIES.map((p) => ({
    pantry: p,
    distanceMiles: haversineMiles(coords, p),
    openOnDay: openOn(p, day),
  }));
  // Keep unknown-hours visible; hide only pantries known to be closed on the chosen day.
  const kept = day === 'any' ? results : results.filter((r) => r.openOnDay !== false);
  return kept.sort((a, b) => a.distanceMiles - b.distanceMiles);
}
