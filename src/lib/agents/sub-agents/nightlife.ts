import { foursquare, tavilySearch } from "@/lib/utils/api-clients";
import { parseFoursquarePlace, type Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface NightlifeParams {
  city: string;
  budget: string;
}

export async function fetchNightlife(params: NightlifeParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "nightlife");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const [fsqRes, tavilyRes] = await Promise.allSettled([
    fetchFoursquareNightlife(params.city),
    tavilySearch(`best bars and nightlife in ${params.city} ${new Date().getFullYear()}`, 5),
  ]);

  const attractions: Attraction[] = [];

  if (fsqRes.status === "fulfilled") attractions.push(...fsqRes.value);

  if (tavilyRes.status === "fulfilled") {
    const results: Attraction[] = (tavilyRes.value.results ?? []).map(
      (r: Record<string, unknown>, i: number) => ({
        id: `tavily-nightlife-${i}`,
        name: String(r.title ?? "").split(" - ")[0],
        category: "nightlife",
        description: String(r.content ?? r.snippet ?? "").slice(0, 200),
        url: String(r.url ?? ""),
      })
    );
    attractions.push(...results);
  }

  await setCached(key, attractions);
  return attractions;
}

async function fetchFoursquareNightlife(city: string): Promise<Attraction[]> {
  const url = new URL(`${foursquare.baseUrl}/search`);
  url.searchParams.set("query", "bar nightclub");
  url.searchParams.set("near", city);
  url.searchParams.set("limit", "15");
  url.searchParams.set("categories", "10032,13003");

  const res = await fetch(url.toString(), {
    headers: { Authorization: foursquare.key(), Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Foursquare error: ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((p: Record<string, unknown>) => ({
    ...parseFoursquarePlace(p),
    category: "nightlife",
  }));
}
