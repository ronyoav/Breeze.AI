import { tavilySearch } from "@/lib/utils/api-clients";
import type { Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface SportsParams {
  city: string;
}

export async function fetchSports(params: SportsParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "sports");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const data = await tavilySearch(
    `best sports activities and stadiums to visit in ${params.city}`,
    8
  );

  const attractions: Attraction[] = (data.results ?? []).map(
    (r: Record<string, unknown>, i: number) => ({
      id: `sports-${i}`,
      name: String(r.title ?? "").split(" - ")[0],
      category: "sports",
      description: String(r.content ?? r.snippet ?? "").slice(0, 250),
      url: String(r.url ?? ""),
    })
  );

  await setCached(key, attractions);
  return attractions;
}
