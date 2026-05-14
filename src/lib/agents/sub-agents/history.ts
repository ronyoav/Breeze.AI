import { openTripMap } from "@/lib/utils/api-clients";
import { parseOpenTripMapPlace, type Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface HistoryParams {
  city: string;
}

export async function fetchHistory(params: HistoryParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "history");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  // Step 1: get city coordinates
  const geoRes = await fetch(
    `${openTripMap.baseUrl}/geoname?name=${encodeURIComponent(params.city)}&apikey=${openTripMap.key()}`
  );
  if (!geoRes.ok) throw new Error(`OpenTripMap geo error: ${geoRes.status}`);
  const geo = await geoRes.json();

  // Step 2: fetch cultural/historic sites within 10km
  const url = new URL(`${openTripMap.baseUrl}/radius`);
  url.searchParams.set("radius", "10000");
  url.searchParams.set("lon", String(geo.lon));
  url.searchParams.set("lat", String(geo.lat));
  url.searchParams.set("kinds", "cultural,historic,architecture");
  url.searchParams.set("rate", "3");
  url.searchParams.set("limit", "20");
  url.searchParams.set("format", "json");
  url.searchParams.set("apikey", openTripMap.key());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OpenTripMap radius error: ${res.status}`);
  const places = await res.json();

  // Step 3: enrich top results with Wikipedia extract
  const enriched = await Promise.all(
    places.slice(0, 12).map(async (p: Record<string, unknown>) => {
      const base = parseOpenTripMapPlace(p);
      try {
        const detail = await fetch(
          `${openTripMap.baseUrl}/xid/${p.xid}?apikey=${openTripMap.key()}&format=json`
        ).then((r) => r.json());
        const extract = (detail.wikipedia_extracts as Record<string, unknown>)?.text;
        if (extract) base.description = String(extract).slice(0, 300);
      } catch {
        // keep base description
      }
      return { ...base, category: "history" };
    })
  );

  await setCached(key, enriched);
  return enriched;
}
