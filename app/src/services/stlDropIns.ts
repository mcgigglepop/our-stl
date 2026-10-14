export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export const DAY_ORDER: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_LABEL: Record<DayKey, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

export interface Hours {
  text: string;
  openDays: DayKey[] | null;
}

export type HygieneService =
  | 'Showers'
  | 'Laundry'
  | 'Clothing'
  | 'Hygiene essentials';

export type DropInAudience = 'adults' | 'youth' | 'all';

export interface DropInCenter {
  id: string;
  name: string;
  audience: DropInAudience;
  services: HygieneService[];
  extras: string[];
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  latitude: number;
  longitude: number;
  hours: Hours;
  source: 'City of St. Louis — drop-in centers directory';
}

export const STL_DROP_INS: DropInCenter[] = [
  {
    id: 'bridge-of-hope',
    name: 'Bridge of Hope Ministries',
    audience: 'adults',
    services: ['Showers', 'Laundry', 'Clothing'],
    extras: ['Adult GED / reading classes', 'Computer access'],
    address: '4001 Cottage Avenue',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63113',
    phone: '314-405-0253',
    website: 'https://www.stlouis-mo.gov/live-work/community/help/drop-in.cfm',
    latitude: 38.656361,
    longitude: -90.231183,
    hours: {
      text: 'Hours not posted — call to confirm',
      openDays: null,
    },
    source: 'City of St. Louis — drop-in centers directory',
  },
  {
    id: 'covenant-house',
    name: 'Covenant House',
    audience: 'youth',
    services: ['Showers', 'Laundry', 'Clothing'],
    extras: ['Shelter', 'Food', 'Blankets', 'Crisis intervention', 'LGBTQ+ welcome'],
    address: '2727 North Kingshighway',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63113',
    phone: '314-533-2241',
    website: 'https://www.stlouis-mo.gov/live-work/community/help/drop-in.cfm',
    latitude: 38.6697791,
    longitude: -90.2571367,
    hours: {
      text: 'Mon–Thu · 9–11 AM (drop-in)',
      openDays: ['mon', 'tue', 'wed', 'thu'],
    },
    source: 'City of St. Louis — drop-in centers directory',
  },
  {
    id: 'restoration-house',
    name: 'Restoration House / The Rock',
    audience: 'youth',
    services: ['Laundry', 'Clothing', 'Hygiene essentials'],
    extras: ['Food', 'Social services', 'Ages 18–24'],
    address: '2912 Chippewa Street',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63118',
    phone: '314-370-7180',
    website: 'https://www.stlouis-mo.gov/live-work/community/help/drop-in.cfm',
    latitude: 38.5868187,
    longitude: -90.2344063,
    hours: {
      text: 'Hours not posted — call to confirm',
      openDays: null,
    },
    source: 'City of St. Louis — drop-in centers directory',
  },
  {
    id: 'the-spot-project-ark',
    name: 'The SPOT / Project ARK',
    audience: 'youth',
    services: ['Showers', 'Laundry'],
    extras: ['Food', 'Computer', 'LGBTQ+ welcome', 'By appointment · ages 13–24'],
    address: '4169 Laclede Avenue',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63108',
    phone: '314-535-0413',
    website: 'https://www.stlouis-mo.gov/live-work/community/help/drop-in.cfm',
    latitude: 38.6378658,
    longitude: -90.2490781,
    hours: {
      text: 'By appointment — call to schedule',
      openDays: null,
    },
    source: 'City of St. Louis — drop-in centers directory',
  },
];
