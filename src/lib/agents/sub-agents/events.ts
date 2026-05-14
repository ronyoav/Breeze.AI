import { ticketmaster, eventbrite } from "@/lib/utils/api-clients";
import type { Attraction } from "@/lib/utils/parsers";
import { getCached, setCached, attractionCacheKey } from "@/lib/cache/redis";

export interface EventsParams {
  city: string;
  startDate: string;
  endDate: string;
}

export async function fetchEvents(params: EventsParams): Promise<Attraction[]> {
  const key = attractionCacheKey(params.city, "events");
  const cached = await getCached<Attraction[]>(key);
  if (cached) return cached;

  const [tmRes, ebRes] = await Promise.allSettled([
    fetchTicketmaster(params),
    fetchEventbrite(params),
  ]);

  const attractions: Attraction[] = [];
  if (tmRes.status === "fulfilled") attractions.push(...tmRes.value);
  if (ebRes.status === "fulfilled") attractions.push(...ebRes.value);

  await setCached(key, attractions);
  return attractions;
}

async function fetchTicketmaster(params: EventsParams): Promise<Attraction[]> {
  const url = new URL(`${ticketmaster.baseUrl}/events.json`);
  url.searchParams.set("apikey", ticketmaster.key());
  url.searchParams.set("city", params.city);
  url.searchParams.set("startDateTime", `${params.startDate}T00:00:00Z`);
  url.searchParams.set("endDateTime", `${params.endDate}T23:59:59Z`);
  url.searchParams.set("size", "10");
  url.searchParams.set("classificationName", "music");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Ticketmaster error: ${res.status}`);
  const data = await res.json();
  const events = data._embedded?.events ?? [];

  return events.map((e: Record<string, unknown>, i: number) => ({
    id: `tm-${e.id ?? i}`,
    name: String(e.name ?? ""),
    category: "events",
    description: String((e.info ?? e.pleaseNote ?? "") as string).slice(0, 200),
    url: String((e.url ?? "") as string),
    address: String(
      ((e._embedded as Record<string, unknown>)?.venues as Record<string, unknown>[])?.[0]?.name ?? ""
    ),
  }));
}

async function fetchEventbrite(params: EventsParams): Promise<Attraction[]> {
  const url = new URL(`${eventbrite.baseUrl}/events/search/`);
  url.searchParams.set("location.address", params.city);
  url.searchParams.set("start_date.range_start", `${params.startDate}T00:00:00Z`);
  url.searchParams.set("start_date.range_end", `${params.endDate}T23:59:59Z`);
  url.searchParams.set("categories", "103");
  url.searchParams.set("expand", "venue");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${eventbrite.key()}` },
  });
  if (!res.ok) throw new Error(`Eventbrite error: ${res.status}`);
  const data = await res.json();

  return (data.events ?? []).slice(0, 8).map((e: Record<string, unknown>, i: number) => ({
    id: `eb-${e.id ?? i}`,
    name: String((e.name as Record<string, unknown>)?.text ?? ""),
    category: "events",
    description: String((e.description as Record<string, unknown>)?.text ?? "").slice(0, 200),
    url: String(e.url ?? ""),
    address: String((e.venue as Record<string, unknown>)?.address?.localized_address_display ?? ""),
  }));
}
