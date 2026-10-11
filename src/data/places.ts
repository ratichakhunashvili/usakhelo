// Central, typed sample data. Coordinates, rates, ratings and distances are
// ILLUSTRATIVE and unverified – replace this file with real data later.

export type Material = 'glass';
export type SortKey = 'payout' | 'distance' | 'rating';

export interface Place {
  id: string;
  name: string;
  /** Street line, e.g. "Tsotne Dadiani Avenue". */
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  material: Material;
  /** Illustrative payout in GEL per kilogram. */
  payoutPerKg: number;
  /** Illustrative rating, 0–5. */
  rating: number;
}

/** Distances are measured from this point (straight line). */
export const DISTANCE_ORIGIN = { name: 'Freedom Square', lat: 41.6934, lng: 44.8015 } as const;

export const PLACES: readonly Place[] = [
  {
    id: 'didube-glass-yard',
    name: 'Didube Glass Yard',
    address: 'Tsotne Dadiani Avenue',
    neighborhood: 'Didube',
    lat: 41.7305,
    lng: 44.7835,
    material: 'glass',
    payoutPerKg: 5.5,
    rating: 4.6,
  },
  {
    id: 'vake-bottle-point',
    name: 'Vake Bottle Point',
    address: 'Chavchavadze Avenue',
    neighborhood: 'Vake',
    lat: 41.7095,
    lng: 44.764,
    material: 'glass',
    payoutPerKg: 5.0,
    rating: 4.8,
  },
  {
    id: 'saburtalo-glass-hub',
    name: 'Saburtalo Glass Hub',
    address: 'Pekini Avenue',
    neighborhood: 'Saburtalo',
    lat: 41.7245,
    lng: 44.7545,
    material: 'glass',
    payoutPerKg: 4.5,
    rating: 4.3,
  },
  {
    id: 'isani-recycling-point',
    name: 'Isani Recycling Point',
    address: 'Ketevan Tsamebuli Avenue',
    neighborhood: 'Isani',
    lat: 41.6905,
    lng: 44.8365,
    material: 'glass',
    payoutPerKg: 4.0,
    rating: 4.1,
  },
];

/** The highest payout is derived from the rates, never hard-coded. */
export const HIGHEST_PAYOUT_ID: string = PLACES.reduce((best, p) =>
  p.payoutPerKg > best.payoutPerKg ? p : best,
).id;

export const getPlace = (id: string | null | undefined): Place | undefined =>
  id ? PLACES.find((p) => p.id === id) : undefined;

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const distanceCache = new Map<string, number>(
  PLACES.map((p) => [
    p.id,
    Math.round(haversineKm(DISTANCE_ORIGIN.lat, DISTANCE_ORIGIN.lng, p.lat, p.lng) * 10) / 10,
  ]),
);

/** Straight-line distance from DISTANCE_ORIGIN in km, one decimal. */
export const distanceKm = (place: Place): number => distanceCache.get(place.id) ?? 0;

export function sortPlaces(list: readonly Place[], key: SortKey): Place[] {
  const copy = [...list];
  copy.sort((a, b) => {
    switch (key) {
      case 'distance':
        return distanceKm(a) - distanceKm(b) || b.payoutPerKg - a.payoutPerKg;
      case 'rating':
        return b.rating - a.rating || b.payoutPerKg - a.payoutPerKg;
      default:
        return b.payoutPerKg - a.payoutPerKg || b.rating - a.rating;
    }
  });
  return copy;
}

/** Case-insensitive match on name, neighbourhood and address; every word must match. */
export function matchesQuery(place: Place, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${place.name} ${place.neighborhood} ${place.address}`.toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export const formatRate = (value: number): string => value.toFixed(2);
