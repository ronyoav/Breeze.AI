import { foursquare } from "@/lib/utils/api-clients";
import { parseFoursquarePlace, type Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface ShoppingParams {
  city: string;
  budget: string;
}

export async function fetchShopping(params: ShoppingParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "shopping");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const query = params.budget === "luxury" ? "luxury boutique" : "shopping market";

  const url = new URL(`${foursquare.baseUrl}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("near", params.city);
  url.searchParams.set("limit", "15");
  url.searchParams.set("categories", "17000,11000");

  const res = await fetch(url.toString(), {
    headers: { Authorization: foursquare.key(), Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Foursquare shopping error: ${res.status}`);
  const data = await res.json();

  const attractions: Attraction[] = (data.results ?? []).map(
    (p: Record<string, unknown>) => ({ ...parseFoursquarePlace(p), category: "shopping" })
  );

  await setCached(key, attractions);
  return attractions;
}
