import { NextRequest, NextResponse } from "next/server";
import type { AttractionItem } from "@/components/types";

export type Concert = AttractionItem;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get("city");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const daysStr = searchParams.get("days") ?? "3";
  const days = Math.max(1, parseInt(daysStr, 10) || 3);

  if (!city || !startDate || !endDate) {
    return NextResponse.json({ concerts: [] }, { status: 400 });
  }

  const tmKey = process.env.TICKETMASTER_API_KEY;
  const ebKey = process.env.EVENTBRITE_API_KEY;

  const concerts: Concert[] = [];

  if (tmKey) {
    const tm = await fetchTicketmaster(city, startDate, endDate, tmKey, days);
    concerts.push(...tm);
  }
  if (ebKey) {
    const eb = await fetchEventbrite(city, startDate, endDate, ebKey, days);
    concerts.push(...eb);
  }

  // Fallback to Tavily + LLM when both return nothing
  if (concerts.length === 0) {
    const tavilyKey = process.env.API_KEY_TAVILY;
    const llmKey = process.env.API_KEY_LLM;
    if (tavilyKey && llmKey) {
      const fallback = await fetchConcertsTavily(city, startDate, endDate, tavilyKey, llmKey, days);
      concerts.push(...fallback);
    }
  }

  if (concerts.length === 0) {
    return NextResponse.json({ concerts: [] }, { status: 404 });
  }
  return NextResponse.json({ concerts });
}

async function fetchTicketmaster(
  city: string, startDate: string, endDate: string, apiKey: string, days: number
): Promise<Concert[]> {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("city", city);
  url.searchParams.set("startDateTime", `${startDate}T00:00:00Z`);
  url.searchParams.set("endDateTime", `${endDate}T23:59:59Z`);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("size", String(Math.max(6, days + 2)));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  const events: Record<string, unknown>[] = data._embedded?.events ?? [];

  return events.map((e, i) => {
    const venues = (e._embedded as Record<string, unknown>)?.venues as Record<string, unknown>[];
    const dateInfo = (e.dates as Record<string, unknown>)?.start as Record<string, unknown>;
    const images = e.images as { url: string; width: number }[] | undefined;
    const bestImage = images?.filter((img) => img.width >= 300).sort((a, b) => b.width - a.width)[0];
    return {
      id: `tm-${e.id ?? i}`,
      name: String(e.name ?? ""),
      description: String((e.info ?? e.pleaseNote ?? "") as string).slice(0, 200),
      date: String(dateInfo?.localDate ?? dateInfo?.dateTime ?? startDate),
      venue: String(venues?.[0]?.name ?? ""),
      url: String(e.url ?? ""),
      image: bestImage?.url,
      source: "Ticketmaster",
    };
  });
}

async function fetchEventbrite(
  city: string, startDate: string, endDate: string, apiKey: string, days: number
): Promise<Concert[]> {
  const url = new URL("https://www.eventbriteapi.com/v3/events/search/");
  url.searchParams.set("location.address", city);
  url.searchParams.set("start_date.range_start", `${startDate}T00:00:00Z`);
  url.searchParams.set("start_date.range_end", `${endDate}T23:59:59Z`);
  url.searchParams.set("categories", "103");
  url.searchParams.set("expand", "venue");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const events: Record<string, unknown>[] = (data.events ?? []).slice(0, Math.max(5, days + 2));

  return events.map((e, i) => {
    const venue = e.venue as Record<string, unknown> | undefined;
    const startObj = e.start as Record<string, unknown> | undefined;
    const logo = e.logo as Record<string, unknown> | undefined;
    return {
      id: `eb-${e.id ?? i}`,
      name: String((e.name as Record<string, unknown>)?.text ?? ""),
      description: String((e.description as Record<string, unknown>)?.text ?? "").slice(0, 200),
      date: String(startObj?.local ?? startDate),
      venue: String(venue?.name ?? ""),
      url: String(e.url ?? ""),
      image: (logo?.original as Record<string, unknown>)?.url as string | undefined,
      source: "Eventbrite",
    };
  });
}

async function fetchConcertsTavily(
  city: string, startDate: string, endDate: string,
  tavilyKey: string, llmKey: string, days: number
): Promise<Concert[]> {
  const tavilyRes = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: tavilyKey,
      query: `concerts live music events ${city} ${startDate}`,
      max_results: Math.max(5, days + 2),
    }),
  });
  if (!tavilyRes.ok) return [];
  const tavilyData = await tavilyRes.json();
  const results: { title: string; url: string; content: string }[] = tavilyData.results ?? [];
  if (results.length === 0) return [];

  const rawText = results.map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n");

  const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmKey}` },
    body: JSON.stringify({
      model: "anthropic/claude-3-5-haiku",
      messages: [{
        role: "user",
        content: `Extract music concerts and live events in ${city} around ${startDate} to ${endDate} from these results.
Return ONLY a valid JSON array:
[{"id":"tavily-1","name":"Event Name","description":"brief description","date":"YYYY-MM-DD or empty string","venue":"venue name","url":"source url","source":"Tavily"}]
Keep ${days} to ${days + 2} events. Output ONLY the JSON array.

${rawText}`,
      }],
    }),
  });
  if (!llmRes.ok) return [];
  const llmData = await llmRes.json();
  const text: string = llmData.choices?.[0]?.message?.content ?? "[]";
  const s = text.indexOf("["), e = text.lastIndexOf("]");
  if (s === -1) return [];
  try { return JSON.parse(text.slice(s, e + 1)); } catch { return []; }
}
