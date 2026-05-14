import { googlePlaces } from "@/lib/utils/api-clients";
import { parseGooglePlace, type Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface RestaurantParams {
  city: string;
  budget: string;
  days: number;
}

export async function fetchRestaurants(params: RestaurantParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "restaurants");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const priceMap: Record<string, string> = { budget: "1", comfort: "2", luxury: "3|4" };
  const url = new URL(`${googlePlaces.baseUrl}/textsearch/json`);
  url.searchParams.set("query", `best restaurants in ${params.city}`);
  url.searchParams.set("type", "restaurant");
  url.searchParams.set("key", googlePlaces.key());
  if (priceMap[params.budget]) url.searchParams.set("minprice", priceMap[params.budget][0]);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Places error: ${res.status}`);
  const data = await res.json();

  const attractions: Attraction[] = (data.results ?? [])
    .slice(0, 15)
    .map((p: Record<string, unknown>) => ({ ...parseGooglePlace(p), category: "restaurants" }));

  await setCached(key, attractions);
  return attractions;
}
