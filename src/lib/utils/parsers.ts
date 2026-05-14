export interface Attraction {
  id: string;
  name: string;
  category: string;
  description: string;
  address?: string;
  rating?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
  openingHours?: string;
  url?: string;
}

export function parseGooglePlace(place: Record<string, unknown>): Attraction {
  return {
    id: String(place.place_id ?? place.id ?? Math.random()),
    name: String(place.name ?? ""),
    category: "restaurant",
    description: String(place.editorial_summary?.overview ?? place.vicinity ?? ""),
    address: String(place.formatted_address ?? place.vicinity ?? ""),
    rating: typeof place.rating === "number" ? place.rating : undefined,
    priceLevel: place.price_level as Attraction["priceLevel"],
    coordinates:
      place.geometry && typeof place.geometry === "object"
        ? {
            lat: (place.geometry as { location: { lat: number; lng: number } }).location.lat,
            lng: (place.geometry as { location: { lat: number; lng: number } }).location.lng,
          }
        : undefined,
  };
}

export function parseFoursquarePlace(place: Record<string, unknown>): Attraction {
  const location = (place.location ?? {}) as Record<string, unknown>;
  return {
    id: String(place.fsq_id ?? Math.random()),
    name: String(place.name ?? ""),
    category: "nightlife",
    description: String(place.description ?? ""),
    address: String(location.formatted_address ?? ""),
    rating: typeof place.rating === "number" ? place.rating / 2 : undefined,
  };
}

export function parseOpenTripMapPlace(place: Record<string, unknown>): Attraction {
  return {
    id: String(place.xid ?? Math.random()),
    name: String(place.name ?? ""),
    category: "history",
    description: String((place.wikipedia_extracts as Record<string, unknown>)?.text ?? place.kinds ?? ""),
    coordinates:
      place.point && typeof place.point === "object"
        ? { lat: (place.point as { lat: number; lon: number }).lat, lng: (place.point as { lat: number; lon: number }).lon }
        : undefined,
  };
}
