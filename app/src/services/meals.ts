import type { DayFilter } from './hygiene';
import { STL_MEALS, type MealProgram } from './stlMeals';

export interface MealResult {
  meal: MealProgram;
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

function openOn(meal: MealProgram, day: DayFilter): boolean | null {
  if (day === 'any') return null;
  if (meal.hours.openDays === null) return null;
  return meal.hours.openDays.includes(day);
}

export function findMealsNear(
  coords: { latitude: number; longitude: number },
  options: { day?: DayFilter } = {}
): MealResult[] {
  const day = options.day ?? 'any';
  const results = STL_MEALS.map((m) => ({
    meal: m,
    distanceMiles: haversineMiles(coords, m),
    openOnDay: openOn(m, day),
  }));
  const kept = day === 'any' ? results : results.filter((r) => r.openOnDay !== false);
  return kept.sort((a, b) => a.distanceMiles - b.distanceMiles);
}
