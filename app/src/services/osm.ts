const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];

export interface OsmDrinkingWater {
  id: number;
  latitude: number;
  longitude: number;
  name: string | null;
  description: string | null;
  bottleRefill: boolean;
  indoor: boolean;
  fee: boolean | null;
  wheelchair: boolean | null;
}

interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string | undefined>;
}

interface OverpassResponse {
  elements: OverpassNode[];
}

function bboxAround(lat: number, lon: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69;
  const lonDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));
  return {
    south: lat - latDelta,
    west: lon - lonDelta,
    north: lat + latDelta,
    east: lon + lonDelta,
  };
}

function buildQuery(lat: number, lon: number, radiusMiles: number): string {
  const b = bboxAround(lat, lon, radiusMiles);
  const bbox = `${b.south},${b.west},${b.north},${b.east}`;
  return `[out:json][timeout:20];(node["amenity"="drinking_water"](${bbox});node["amenity"="water_point"](${bbox}););out body;`;
}

function toYesNo(v: string | undefined): boolean | null {
  if (!v) return null;
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
}

export async function findDrinkingWaterNear(
  coords: { latitude: number; longitude: number },
  options: { radiusMiles?: number; signal?: AbortSignal } = {}
): Promise<OsmDrinkingWater[]> {
  const radius = options.radiusMiles ?? 15;
  const query = buildQuery(coords.latitude, coords.longitude, radius);
  const body = `data=${encodeURIComponent(query)}`;

  let lastError: unknown = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: options.signal,
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${endpoint} returned ${res.status}`);
        continue;
      }
      const data = (await res.json()) as OverpassResponse;
      return (data.elements ?? []).map((n) => ({
        id: n.id,
        latitude: n.lat,
        longitude: n.lon,
        name: n.tags?.name ?? null,
        description: n.tags?.description ?? n.tags?.note ?? null,
        bottleRefill: n.tags?.bottle === 'yes' || n.tags?.['drinking_water:refill'] === 'yes',
        indoor: n.tags?.indoor === 'yes',
        fee: toYesNo(n.tags?.fee),
        wheelchair: toYesNo(n.tags?.wheelchair),
      }));
    } catch (err) {
      if (options.signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All Overpass endpoints failed.');
}
