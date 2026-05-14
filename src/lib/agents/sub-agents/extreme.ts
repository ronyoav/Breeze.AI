import { tavilySearch } from "@/lib/utils/api-clients";
import type { Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface ExtremeParams {
  city: string;
}

export async function fetchExtreme(params: ExtremeParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "extreme");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const data = await tavilySearch(
    `extreme sports and adventure activities near ${params.city} — skydiving, bungee, surfing, paragliding`,
    8
  );

  const attractions: Attraction[] = (data.results ?? []).map(
    (r: Record<string, unknown>, i: number) => ({
      id: `extreme-${i}`,
      name: String(r.title ?? "").split(" - ")[0],
      category: "extreme",
      description: String(r.content ?? r.snippet ?? "").slice(0, 250),
      url: String(r.url ?? ""),
    })
  );

  await setCached(key, attractions);
  return attractions;
}
