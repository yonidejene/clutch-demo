/** Mock padel venue data. Each card picks a venue deterministically by video id. */
export interface Venue {
  name: string;
  city: string;
  region: string;
}

const VENUES: Venue[] = [
  { name: 'The Pad', city: 'Brooklyn', region: 'NY' },
  { name: 'Padel Haus', city: 'Williamsburg', region: 'NY' },
  { name: 'SoCal Padel', city: 'Los Angeles', region: 'CA' },
  { name: 'Miami Padel Club', city: 'Miami', region: 'FL' },
  { name: 'Padel Bay', city: 'San Francisco', region: 'CA' },
  { name: 'Austin Padel Co', city: 'Austin', region: 'TX' },
  { name: 'Racquet Park', city: 'Chicago', region: 'IL' },
  { name: 'Padel Social', city: 'Denver', region: 'CO' },
  { name: 'Net House', city: 'Nashville', region: 'TN' },
  { name: 'Smash Padel', city: 'Seattle', region: 'WA' },
];

/** Mock relative timestamps cycling through a realistic range. */
const TIMESTAMPS = ['12m', '1h', '2h', '3h', '5h', '8h', '12h', '1d', '2d', '3d'];

export function getVenue(videoId: number): Venue {
  return VENUES[videoId % VENUES.length];
}

export function getRelativeTime(videoId: number): string {
  return TIMESTAMPS[videoId % TIMESTAMPS.length];
}
