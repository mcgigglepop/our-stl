import type { DayKey } from './stlDropIns';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'to-go';

export interface MealHours {
  text: string;
  openDays: DayKey[] | null;
}

export interface MealProgram {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website: string;
  latitude: number;
  longitude: number;
  mealTypes: MealType[];
  hours: MealHours;
  notes: string[];
  source: 'City of St. Louis — food resources';
}

const SRC: MealProgram['source'] = 'City of St. Louis — food resources';
const FOOD_PAGE = 'https://www.stlouis-mo.gov/live-work/community/help/food.cfm';
const ALL_DAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const STL_MEALS: MealProgram[] = [
  {
    id: 'central-baptist',
    name: 'Central Baptist Church',
    address: '2845 Washington Ave',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63103',
    phone: '314-533-0747',
    website: FOOD_PAGE,
    latitude: 38.6361586,
    longitude: -90.2184709,
    mealTypes: ['lunch'],
    hours: { text: 'Lunch · Tuesdays at 11:45 AM', openDays: ['tue'] },
    notes: ['Entry at the T.E. Huntly Avenue entrance'],
    source: SRC,
  },
  {
    id: 'centennial-christian',
    name: 'Centennial Christian Church',
    address: '4950 Fountain Ave',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63113',
    phone: '314-367-1818',
    website: FOOD_PAGE,
    latitude: 38.655494,
    longitude: -90.2617648,
    mealTypes: ['lunch', 'dinner'],
    hours: {
      text: 'Lunch Mon–Fri 11:30 AM – 1 PM · Dinner Mon/Wed/Fri 4:30 – 6 PM',
      openDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    },
    notes: ['Food is served in the parking lot behind the church'],
    source: SRC,
  },
  {
    id: 'focus-gateway-city',
    name: 'Focus Gateway City',
    address: '1901 Ann Ave (inside St. Michael’s Orthodox Church)',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63104',
    phone: null,
    website: FOOD_PAGE,
    latitude: 38.6081866,
    longitude: -90.2142815,
    mealTypes: ['breakfast', 'dinner'],
    hours: {
      text: 'Supper Sun 4:30 – 5:30 PM · Breakfast Wed 9 – 11 AM (2nd – 21st of each month)',
      openDays: ['sun', 'wed'],
    },
    notes: ['Pantry and clothing closet available every time they are open', 'Haircuts offered periodically'],
    source: SRC,
  },
  {
    id: 'gateway-180-brown-bag',
    name: 'Gateway 180 — Brown Bag Lunch',
    address: '1000 North 19th St',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63106',
    phone: '314-231-1515',
    website: FOOD_PAGE,
    latitude: 38.6375584,
    longitude: -90.2047514,
    mealTypes: ['to-go'],
    hours: { text: 'Brown bag lunches · 7 days a week, all day', openDays: ALL_DAYS },
    notes: [],
    source: SRC,
  },
  {
    id: 'project-downtown',
    name: 'Project Downtown',
    address: '6809 W Florissant Ave',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63136',
    phone: '314-518-5342',
    website: FOOD_PAGE,
    latitude: 38.7167718,
    longitude: -90.2597485,
    mealTypes: ['lunch'],
    hours: { text: 'Full meal + pantry · Saturdays 11:30 AM – 1 PM', openDays: ['sat'] },
    notes: ['Pantry provided alongside the meal'],
    source: SRC,
  },
  {
    id: 'salvation-army-arsenal-meals',
    name: 'Salvation Army — Community Meals',
    address: '2740 Arsenal St',
    city: 'Saint Louis',
    state: 'MO',
    zip: null,
    phone: '314-771-3460',
    website: FOOD_PAGE,
    latitude: 38.599809,
    longitude: -90.227763,
    mealTypes: ['dinner'],
    hours: { text: 'Community meals · Wednesday only, 6 – 8 PM', openDays: ['wed'] },
    notes: [],
    source: SRC,
  },
  {
    id: 'soup-alley-trinity',
    name: 'Soup Alley / Trinity Church',
    address: '812 Soulard St',
    city: 'Saint Louis',
    state: 'MO',
    zip: null,
    phone: '314-231-4092',
    website: FOOD_PAGE,
    latitude: 38.6093185,
    longitude: -90.2029159,
    mealTypes: ['breakfast'],
    hours: { text: 'Mon–Sat · 9:30 – 10:30 AM', openDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
    notes: [],
    source: SRC,
  },
  {
    id: 'st-johns-episcopal',
    name: 'St. Johns Episcopal Church (Tower Grove)',
    address: '3672 Arsenal St',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63116',
    phone: '314-772-3970',
    website: FOOD_PAGE,
    latitude: 38.6028614,
    longitude: -90.2436862,
    mealTypes: ['to-go'],
    hours: { text: 'Lunches to-go · Saturdays 4 – 5:30 PM', openDays: ['sat'] },
    notes: [],
    source: SRC,
  },
  {
    id: 'st-patrick-shamrock',
    name: 'St. Patrick Center — Shamrock Club',
    address: '800 N Tucker Blvd',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63101',
    phone: '314-802-0700',
    website: FOOD_PAGE,
    latitude: 38.6333929,
    longitude: -90.1956077,
    mealTypes: ['lunch'],
    hours: { text: 'Lunch · 7 days a week, Noon – 12:30 PM', openDays: ALL_DAYS },
    notes: [],
    source: SRC,
  },
  {
    id: 'st-peter-and-paul',
    name: 'Ss. Peter and Paul Parish — Mid-Level Hall',
    address: '1919 S 7th St',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63104',
    phone: '314-231-9923',
    website: FOOD_PAGE,
    latitude: 38.6072272,
    longitude: -90.2031999,
    mealTypes: ['dinner', 'lunch'],
    hours: {
      text: 'Mon–Fri 5 – 5:45 PM · Sat/Sun 12 – 12:45 PM (2nd – 21st of each month)',
      openDays: ALL_DAYS,
    },
    notes: ['Only runs the 2nd through the 21st of each month'],
    source: SRC,
  },
  {
    id: 'st-vincent-de-paul-meals',
    name: 'St. Vincent de Paul — Free Bread Table & Sandwich Window',
    address: '1408 S 10th St',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63104',
    phone: '314-231-9328',
    website: FOOD_PAGE,
    latitude: 38.6134209,
    longitude: -90.2010243,
    mealTypes: ['lunch', 'dinner'],
    hours: {
      text:
        'Free Bread Table Mon–Thu 12 – 2 PM · Sandwich window Mon–Sat 11 AM – 1 PM · Dinner on 22nd – 1st of month 5 – 6 PM',
      openDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    },
    notes: ['Dinner service runs only the 22nd through 1st of each month'],
    source: SRC,
  },
  {
    id: 'trinity-episcopal',
    name: 'Trinity Episcopal Church (Central West End)',
    address: '600 N Euclid Ave',
    city: 'Saint Louis',
    state: 'MO',
    zip: '63108',
    phone: '314-361-4655',
    website: FOOD_PAGE,
    latitude: 38.6503609,
    longitude: -90.2601972,
    mealTypes: ['lunch', 'dinner'],
    hours: {
      text:
        'Tue 1:30 – 3 PM (take-out hot meal + pantry) · Wed 12 – 1:30 PM (cafe) · Thu 4 – 5 PM (take-out) · Sun 2 – 2:30 PM (hot lunch)',
      openDays: ['tue', 'wed', 'thu', 'sun'],
    },
    notes: ['Enter through the Washington Avenue entrance'],
    source: SRC,
  },
];
