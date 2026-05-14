import { tavilySearch } from "@/lib/utils/api-clients";
import type { Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface ViralParams {
  city: string;
}

export async function fetchViral(params: ViralParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "viral");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const data = await tavilySearch(
    `viral Instagram spots hidden gems must-see ${params.city} ${new Date().getFullYear()}`,
    8
  );

  const attractions: Attraction[] = (data.results ?? []).map(
    (r: Record<string, unknown>, i: number) => ({
      id: `viral-${i}`,
      name: String(r.title ?? "").split(" - ")[0],
      category: "viral",
      description: String(r.content ?? r.snippet ?? "").slice(0, 250),
      url: String(r.url ?? ""),
    })
  );

  await setCached(key, attractions);
  return attractions;
}
