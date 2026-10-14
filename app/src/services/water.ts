import { findDrinkingWaterNear, type OsmDrinkingWater } from './osm';
import { STL_PUBLIC_FACILITIES, type CuratedFacility } from './stlFacilities';

export type WaterSourceKind = 'fountain' | 'library';

export interface WaterSource {
  id: string;
  kind: WaterSourceKind;
  name: string;
  subtitle: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  notes: string[];
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

function osmToSource(n: OsmDrinkingWater, origin: { latitude: number; longitude: number }): WaterSource {
  const notes: string[] = [];
  if (n.bottleRefill) notes.push('Bottle refill');
  if (n.indoor) notes.push('Indoor');
  if (n.fee === false) notes.push('Free');
  if (n.wheelchair === true) notes.push('Wheelchair accessible');
  return {
    id: `osm-${n.id}`,
    kind: 'fountain',
    name: n.name ?? 'Public drinking fountain',
    subtitle: n.description,
    address: null,
    phone: null,
    website: null,
    latitude: n.latitude,
    longitude: n.longitude,
    distanceMiles: haversineMiles(origin, n),
    notes,
  };
}

function facilityToSource(f: CuratedFacility, origin: { latitude: number; longitude: number }): WaterSource {
  return {
    id: f.id,
    kind: 'library',
    name: f.name,
    subtitle: f.operator,
    address: `${f.address}, ${f.city}, ${f.state} ${f.zip}`,
    phone: f.phone,
    website: f.website,
    latitude: f.latitude,
    longitude: f.longitude,
    distanceMiles: haversineMiles(origin, f),
    notes: ['Public building', 'Open hours posted'],
  };
}

export async function findWaterNear(
  coords: { latitude: number; longitude: number },
  options: { radiusMiles?: number; signal?: AbortSignal } = {}
): Promise<WaterSource[]> {
  const radius = options.radiusMiles ?? 10;

  const curated = STL_PUBLIC_FACILITIES.map((f) => facilityToSource(f, coords)).filter(
    (s) => s.distanceMiles <= radius
  );

  let osm: WaterSource[] = [];
  try {
    const nodes = await findDrinkingWaterNear(coords, { radiusMiles: radius, signal: options.signal });
    osm = nodes.map((n) => osmToSource(n, coords));
  } catch {
    // Non-fatal: curated layer alone is still useful.
  }

  return [...osm, ...curated].sort((a, b) => a.distanceMiles - b.distanceMiles);
}
