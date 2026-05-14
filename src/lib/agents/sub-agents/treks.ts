import { openTripMap } from "@/lib/utils/api-clients";
import { parseOpenTripMapPlace, type Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface TreksParams {
  city: string;
}

export async function fetchTreks(params: TreksParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "treks");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const geoRes = await fetch(
    `${openTripMap.baseUrl}/geoname?name=${encodeURIComponent(params.city)}&apikey=${openTripMap.key()}`
  );
  if (!geoRes.ok) throw new Error(`OpenTripMap geo error: ${geoRes.status}`);
  const geo = await geoRes.json();

  const url = new URL(`${openTripMap.baseUrl}/radius`);
  url.searchParams.set("radius", "30000");
  url.searchParams.set("lon", String(geo.lon));
  url.searchParams.set("lat", String(geo.lat));
  url.searchParams.set("kinds", "natural,hiking,beaches,parks");
  url.searchParams.set("rate", "2");
  url.searchParams.set("limit", "15");
  url.searchParams.set("format", "json");
  url.searchParams.set("apikey", openTripMap.key());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OpenTripMap treks error: ${res.status}`);
  const places = await res.json();

  const attractions: Attraction[] = places
    .slice(0, 12)
    .map((p: Record<string, unknown>) => ({ ...parseOpenTripMapPlace(p), category: "treks" }));

  await setCached(key, attractions);
  return attractions;
}
