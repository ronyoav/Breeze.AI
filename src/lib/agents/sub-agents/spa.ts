import { googlePlaces } from "@/lib/utils/api-clients";
import { parseGooglePlace, type Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface SpaParams {
  city: string;
  budget: string;
}

export async function fetchSpa(params: SpaParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "spa");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const query =
    params.budget === "luxury"
      ? `luxury spa wellness ${params.city}`
      : `spa massage wellness ${params.city}`;

  const url = new URL(`${googlePlaces.baseUrl}/textsearch/json`);
  url.searchParams.set("query", query);
  url.searchParams.set("type", "spa");
  url.searchParams.set("key", googlePlaces.key());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Places spa error: ${res.status}`);
  const data = await res.json();

  const attractions: Attraction[] = (data.results ?? [])
    .slice(0, 12)
    .map((p: Record<string, unknown>) => ({ ...parseGooglePlace(p), category: "spa" }));

  await setCached(key, attractions);
  return attractions;
}
