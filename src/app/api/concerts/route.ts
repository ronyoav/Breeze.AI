import { NextRequest, NextResponse } from "next/server";

export interface Concert {
  id: string;
  name: string;
  date: string;
  venue: string;
  url: string;
  image?: string;
  source: "Ticketmaster" | "Eventbrite";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get("city");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!city || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing city, startDate, or endDate" }, { status: 400 });
  }

  const tmKey = process.env.TICKETMASTER_API_KEY;
  const ebKey = process.env.EVENTBRITE_API_KEY;

  if (!tmKey || !ebKey) {
    return NextResponse.json({ error: "API keys not configured" }, { status: 500 });
  }

  const [tmResult, ebResult] = await Promise.allSettled([
    fetchTicketmaster(city, startDate, endDate, tmKey),
    fetchEventbrite(city, startDate, endDate, ebKey),
  ]);

  const concerts: Concert[] = [];
  if (tmResult.status === "fulfilled") concerts.push(...tmResult.value);
  if (ebResult.status === "fulfilled") concerts.push(...ebResult.value);

  if (concerts.length === 0) {
    return NextResponse.json({ concerts: [] }, { status: 404 });
  }

  return NextResponse.json({ concerts });
}

async function fetchTicketmaster(
  city: string,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<Concert[]> {
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("city", city);
  url.searchParams.set("startDateTime", `${startDate}T00:00:00Z`);
  url.searchParams.set("endDateTime", `${endDate}T23:59:59Z`);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("size", "12");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();

  const events: Record<string, unknown>[] = data._embedded?.events ?? [];
  return events.map((e, i) => {
    const venues = (e._embedded as Record<string, unknown>)?.venues as Record<string, unknown>[];
    const venue = venues?.[0];
    const dateInfo = (e.dates as Record<string, unknown>)?.start as Record<string, unknown>;
    const images = e.images as { url: string; width: number }[] | undefined;
    const bestImage = images
      ?.filter((img) => img.width >= 300)
      .sort((a, b) => b.width - a.width)[0];

    return {
      id: `tm-${e.id ?? i}`,
      name: String(e.name ?? ""),
      date: String(dateInfo?.localDate ?? dateInfo?.dateTime ?? startDate),
      venue: String(venue?.name ?? ""),
      url: String(e.url ?? ""),
      image: bestImage?.url,
      source: "Ticketmaster" as const,
    };
  });
}

async function fetchEventbrite(
  city: string,
  startDate: string,
  endDate: string,
  apiKey: string
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

  const events: Record<string, unknown>[] = (data.events ?? []).slice(0, 10);
  return events.map((e, i) => {
    const venue = e.venue as Record<string, unknown> | undefined;
    const startObj = e.start as Record<string, unknown> | undefined;
    const logo = e.logo as Record<string, unknown> | undefined;

    return {
      id: `eb-${e.id ?? i}`,
      name: String((e.name as Record<string, unknown>)?.text ?? ""),
      date: String(startObj?.local ?? startDate),
      venue: String(venue?.name ?? ""),
      url: String(e.url ?? ""),
      image: (logo?.original as Record<string, unknown>)?.url as string | undefined,
      source: "Eventbrite" as const,
    };
  });
}
