import type { DayKey } from './stlDropIns';

export type ShelterAudience = 'all' | 'adults' | 'families' | 'women' | 'youth' | 'men';

export const AUDIENCE_LABEL: Record<ShelterAudience, string> = {
  all: 'All',
  adults: 'Adults',
  families: 'Families',
  women: 'Women',
  youth: 'Youth',
  men: 'Men',
};

export interface ShelterHours {
  text: string;
  openDays: DayKey[] | null; // null = not posted on primary source
}

export interface ShelterProvider {
  id: string;
  name: string;
  audience: ShelterAudience;
  services: string[];
  phone: string;
  altPhone: { label: string; number: string } | null;
  website: string;
  // Address + coords are null when the primary source doesn't publish them.
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  hours: ShelterHours;
  source: 'City of St. Louis — housing resources';
}

const SRC: ShelterProvider['source'] = 'City of St. Louis — housing resources';

export const STL_SHELTERS: ShelterProvider[] = [
  {
    id: 'st-patrick-center',
    name: 'St. Patrick Center',
    audience: 'adults',
    services: ['Housing First', 'Support services for the homeless'],
    phone: '314-802-0700',
    altPhone: null,
    website: 'https://www.stpatrickcenter.org/',
    address: '800 N Tucker Blvd',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63103',
    latitude: 38.6333929,
    longitude: -90.1956077,
    hours: { text: 'Call for intake hours', openDays: null },
    source: SRC,
  },
  {
    id: 'city-hope-stl',
    name: 'City Hope St. Louis',
    audience: 'all',
    services: ['Emergency shelter', 'Transitional housing', 'Warming centers'],
    phone: '314-904-4673',
    altPhone: null,
    website: 'https://www.cityhopestl.org/',
    address: '4001 Maffitt Ave',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63113',
    latitude: 38.658449,
    longitude: -90.229705,
    hours: { text: 'Call for current shelter + warming hours', openDays: null },
    source: SRC,
  },
  {
    id: 'gateway-180',
    name: 'Gateway 180 Homeless Services',
    audience: 'all',
    services: ['24-hour emergency shelter', 'Permanent housing assistance', 'Meals', 'Counseling'],
    phone: '314-231-1515',
    altPhone: { label: 'Housing Resource Hotline', number: '314-802-5444' },
    website: 'https://gateway180.org/',
    address: '1000 N 19th St',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63106',
    latitude: 38.6375584,
    longitude: -90.2047514,
    hours: {
      text: '24-hour emergency shelter · 7 days',
      openDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    },
    source: SRC,
  },
  {
    id: 'criminal-justice-ministry',
    name: 'Criminal Justice Ministry',
    audience: 'adults',
    services: ['Transitional housing (reentry)', 'Support groups', 'Hygiene items'],
    phone: '314-652-8062',
    altPhone: null,
    website: 'https://www.cjmstlouis.org/contact',
    address: '2342 Lasalle St',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63104',
    latitude: 38.6208441,
    longitude: -90.2172606,
    hours: { text: 'Call for intake', openDays: null },
    source: SRC,
  },
  {
    id: 'doorways',
    name: 'Doorways',
    audience: 'all',
    services: ['30–60 day emergency housing (HIV/AIDS)', 'Family housing', 'Housing financial assistance'],
    phone: '314-535-1919',
    altPhone: null,
    website: 'https://doorwayshousing.org/',
    address: 'N Jefferson Ave',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63107',
    latitude: 38.6406184,
    longitude: -90.2135135,
    hours: { text: 'Call for program intake', openDays: null },
    source: SRC,
  },
  {
    id: 'father-dempseys',
    name: "Father Dempsey's Charities",
    audience: 'men',
    services: ['Transitional housing for men', 'Nightly dinner', 'Saturday breakfast'],
    phone: '314-792-7005',
    altPhone: null,
    website: 'https://www.archstl.org/father-dempseys-charities',
    address: null,
    city: 'Saint Louis',
    state: 'MO',
    zip: null,
    latitude: null,
    longitude: null,
    hours: { text: 'Call for admission', openDays: null },
    source: SRC,
  },
  {
    id: 'haven-of-grace',
    name: 'Haven of Grace',
    audience: 'women',
    services: ['Maternity shelter', 'Transitional housing', 'Case management'],
    phone: '314-621-6507',
    altPhone: null,
    website: 'https://havenofgracestl.org/',
    address: '1225 Warren St',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63106',
    latitude: 38.6501222,
    longitude: -90.1953077,
    hours: { text: 'Call for intake · pregnant women', openDays: null },
    source: SRC,
  },
  {
    id: 'hope-house',
    name: 'Hope House',
    audience: 'all',
    services: ['Transitional housing (individuals + families)', 'Career development', 'Child Development Center'],
    phone: '314-382-3801',
    altPhone: null,
    website: 'http://www.hopehousestl.org/',
    address: null,
    city: 'Saint Louis',
    state: 'MO',
    zip: null,
    latitude: null,
    longitude: null,
    hours: { text: 'Call for intake', openDays: null },
    source: SRC,
  },
  {
    id: 'magdala-house',
    name: 'Magdala House',
    audience: 'adults',
    services: ['Transitional tiny homes', 'Counseling', 'Meals / showers / laundry'],
    phone: '314-652-6004',
    altPhone: null,
    website: 'https://www.magdala-house.org/homeless-programs',
    address: '4158 Lindell Blvd',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63108',
    latitude: 38.6400091,
    longitude: -90.2479631,
    hours: { text: 'Call for program intake', openDays: null },
    source: SRC,
  },
  {
    id: 'salvation-army-family-haven',
    name: 'Salvation Army Family Haven',
    audience: 'families',
    services: [
      'Emergency shelter',
      'Domestic violence services',
      'Transitional housing',
      'Casework services',
    ],
    phone: '314-423-7770',
    altPhone: null,
    website: 'https://centralusa.salvationarmy.org/stlouis/',
    address: null,
    city: 'Saint Louis',
    state: 'MO',
    zip: null,
    latitude: null,
    longitude: null,
    hours: { text: 'Call for intake', openDays: null },
    source: SRC,
  },
];
