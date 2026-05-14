import { NextRequest, NextResponse } from "next/server";
import type { AttractionItem } from "@/components/types";

const CATEGORY_QUERIES: Record<string, string> = {
  nightlife: "best bars nightlife clubs cocktail bars local scene",
  history: "historical sites monuments museums old town heritage",
  sports: "sports venues local teams matches events stadiums",
  extreme: "extreme sports adventure surfing diving paragliding",
  beach: "best beaches coastal spots swimming snorkeling",
  spa: "luxury spa wellness centers hammam massage retreats",
  shopping: "best shopping markets boutiques design stores souvenirs",
  viral: "viral trending instagrammable iconic spots must-see",
};

const CATEGORY_LABELS: Record<string, string> = {
  nightlife: "nightlife bar or club",
  history: "historical site, monument, or museum",
  sports: "sports venue or event",
  extreme: "adventure activity",
  beach: "beach or coastal spot",
  spa: "spa or wellness center",
  shopping: "shop, market, or boutique",
  viral: "trending or iconic spot",
};

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const category = req.nextUrl.searchParams.get("category") ?? "";
  const budget = req.nextUrl.searchParams.get("budget") ?? "comfort";
  const daysStr = req.nextUrl.searchParams.get("days") ?? "3";
  const days = Math.max(1, parseInt(daysStr, 10) || 3);

  if (!city || !category) {
    return NextResponse.json({ attractions: [] }, { status: 400 });
  }

  const tavilyKey = process.env.API_KEY_TAVILY;
  const llmKey = process.env.API_KEY_LLM;

  if (!tavilyKey || !llmKey) {
    return NextResponse.json({ attractions: [] }, { status: 500 });
  }

  const query = CATEGORY_QUERIES[category] ?? category;
  const tavilyRes = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: tavilyKey,
      query: `best ${query} ${city}`,
      max_results: Math.max(5, days + 2),
    }),
    next: { revalidate: 86400 },
  });

  if (!tavilyRes.ok) return NextResponse.json({ attractions: [] }, { status: 404 });

  const tavilyData = await tavilyRes.json();
  const results: { title: string; url: string; content: string }[] = tavilyData.results ?? [];
  if (results.length === 0) return NextResponse.json({ attractions: [] }, { status: 404 });

  const rawText = results.map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n");
  const itemLabel = CATEGORY_LABELS[category] ?? category;
  const budgetNote = budget === "budget" ? "budget-friendly" : budget === "luxury" ? "upscale" : "mid-range";

  const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmKey}` },
    body: JSON.stringify({
      model: "anthropic/claude-3-5-haiku",
      messages: [{
        role: "user",
        content: `Extract the best ${budgetNote} ${itemLabel} options in ${city} from these search results.
Return ONLY a valid JSON array:
[
  {
    "id": "${category}-1",
    "name": "Place or Activity Name",
    "description": "2-3 sentence description",
    "address": "neighborhood or area",
    "url": "source url if available, else empty string",
    "tip": "one practical tip — best time, what to order, price range, reservation needed"
  }
]
Keep ${days} to ${days + 2} distinct options. Output ONLY the JSON array.

${rawText}`,
      }],
    }),
  });

  if (!llmRes.ok) return NextResponse.json({ attractions: [] }, { status: 404 });

  const llmData = await llmRes.json();
  const text: string = llmData.choices?.[0]?.message?.content ?? "[]";
  const s = text.indexOf("["), e = text.lastIndexOf("]");
  if (s === -1) return NextResponse.json({ attractions: [] }, { status: 404 });

  let attractions: AttractionItem[] = [];
  try { attractions = JSON.parse(text.slice(s, e + 1)); } catch { /* fall through */ }

  if (attractions.length === 0) return NextResponse.json({ attractions: [] }, { status: 404 });
  return NextResponse.json({ attractions });
}
