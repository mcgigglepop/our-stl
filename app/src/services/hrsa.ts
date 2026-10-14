export interface HealthCenter {
  id: number;
  name: string;
  parentOrg: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
  distanceMiles: number;
}

interface HrsaSite {
  Id: number;
  CtrNm: string;
  ParentCtrNm: string | null;
  CtrAddress: string;
  CtrCity: string;
  CtrStateAbbr: string;
  CtrZipCd: string;
  CtrPhoneNum: string | null;
  SiteUrl: string | null;
  UrlTxt: string | null;
  Latitude: number;
  Longitude: number;
  Distance: number;
  EndDt: string | null;
}

const HRSA_BASE = 'https://data.hrsa.gov/HDWLocatorApi';

function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function toCenter(site: HrsaSite): HealthCenter {
  return {
    id: site.Id,
    name: site.CtrNm,
    parentOrg: site.ParentCtrNm && site.ParentCtrNm !== site.CtrNm ? site.ParentCtrNm : null,
    address: site.CtrAddress,
    city: site.CtrCity,
    state: site.CtrStateAbbr,
    zip: site.CtrZipCd,
    phone: site.CtrPhoneNum?.trim() || null,
    website: normalizeUrl(site.SiteUrl || site.UrlTxt),
    latitude: site.Latitude,
    longitude: site.Longitude,
    distanceMiles: site.Distance,
  };
}

export async function findHealthCentersNear(
  coords: { latitude: number; longitude: number },
  options: { radiusMiles?: number; signal?: AbortSignal } = {}
): Promise<HealthCenter[]> {
  const radius = options.radiusMiles ?? 15;
  const url = `${HRSA_BASE}/healthcenters/find?lon=${coords.longitude}&lat=${coords.latitude}&radius=${radius}`;
  const res = await fetch(url, { signal: options.signal });
  if (!res.ok) {
    throw new Error(`HRSA request failed (${res.status})`);
  }
  const data = (await res.json()) as HrsaSite[];
  return data
    .filter((s) => !s.EndDt && Number.isFinite(s.Latitude) && Number.isFinite(s.Longitude))
    .map(toCenter)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}
