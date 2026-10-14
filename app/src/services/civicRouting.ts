export type CivicIssue =
  | 'Pothole'
  | 'Illegal dumping'
  | 'Graffiti'
  | 'Streetlight problem'
  | 'Damaged sidewalk'
  | 'Overgrown tree'
  | 'Unsafe building'
  | 'Water service issue';

export type Jurisdiction = 'city' | 'other';

export interface IssueChip {
  key: CivicIssue;
  icon: string;
  label: string;
  subtitle: string;
}

export const ISSUE_CHIPS: IssueChip[] = [
  { key: 'Pothole', icon: '🕳️', label: 'Pothole', subtitle: 'Street repairs' },
  { key: 'Illegal dumping', icon: '🗑️', label: 'Illegal dumping', subtitle: 'Refuse / sanitation' },
  { key: 'Graffiti', icon: '🎨', label: 'Graffiti', subtitle: 'Cleanup / property' },
  { key: 'Streetlight problem', icon: '💡', label: 'Streetlight', subtitle: 'Lighting / utilities' },
  { key: 'Damaged sidewalk', icon: '🚶', label: 'Sidewalk', subtitle: 'Streets / accessibility' },
  { key: 'Overgrown tree', icon: '🌳', label: 'Tree / weeds', subtitle: 'Forestry' },
];

export const ALL_ISSUES: CivicIssue[] = [
  'Pothole',
  'Illegal dumping',
  'Graffiti',
  'Streetlight problem',
  'Damaged sidewalk',
  'Overgrown tree',
  'Unsafe building',
  'Water service issue',
];

interface Route {
  service: string;
  nextStep: string;
}

const ROUTES: Record<CivicIssue, Route> = {
  Pothole: {
    service: 'Streets Department — street maintenance',
    nextStep: 'CSB service request; exact service type confirmed by CSB',
  },
  'Illegal dumping': {
    service: 'Refuse Division / CSB sanitation routing',
    nextStep: 'Responsibility may depend on public versus private property',
  },
  Graffiti: {
    service: 'CSB graffiti / property-maintenance routing',
    nextStep: 'Ownership and location affect the correct response team',
  },
  'Streetlight problem': {
    service: 'CSB streetlight / utility routing',
    nextStep: 'City-maintained and utility-maintained lights may differ',
  },
  'Damaged sidewalk': {
    service: 'Streets Department / CSB sidewalk routing',
    nextStep: 'Ownership and accessibility context may change assignment',
  },
  'Overgrown tree': {
    service: 'Forestry Division',
    nextStep: 'City tree and vacant-lot vegetation requests can be routed differently',
  },
  'Unsafe building': {
    service: 'Building Division / CSB property complaints',
    nextStep: 'Inspection and code enforcement may apply',
  },
  'Water service issue': {
    service: 'City Water Division / appropriate water utility',
    nextStep: 'Water provider depends on jurisdiction and issue',
  },
};

export type RoutingResult =
  | { kind: 'city'; service: string; nextStep: string }
  | { kind: 'other' };

export function routeIssue(issue: CivicIssue, jurisdiction: Jurisdiction): RoutingResult {
  if (jurisdiction !== 'city') return { kind: 'other' };
  const r = ROUTES[issue];
  return { kind: 'city', service: r.service, nextStep: r.nextStep };
}

export function draftDescription(issue: CivicIssue): string {
  return (
    `I noticed a ${issue.toLowerCase()} issue at the location provided. It may affect public access or ` +
    `neighborhood conditions. Please review and assess the area.`
  );
}
