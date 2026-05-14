import { googlePlaces } from "@/lib/utils/api-clients";
import { parseGooglePlace, type Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface BeachParams {
  city: string;
}

export async function fetchBeach(params: BeachParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "beach");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const url = new URL(`${googlePlaces.baseUrl}/textsearch/json`);
  url.searchParams.set("query", `best beaches near ${params.city}`);
  url.searchParams.set("key", googlePlaces.key());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Places beach error: ${res.status}`);
  const data = await res.json();

  const attractions: Attraction[] = (data.results ?? [])
    .slice(0, 12)
    .map((p: Record<string, unknown>) => ({ ...parseGooglePlace(p), category: "beach" }));

  await setCached(key, attractions);
  return attractions;
}
