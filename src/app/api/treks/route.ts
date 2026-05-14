import { NextRequest, NextResponse } from "next/server";

export interface Trek {
  id: string;
  name: string;
  description: string;
  address: string;
  url: string;
  tip?: string;
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const daysStr = req.nextUrl.searchParams.get("days") ?? "3";
  const days = Math.max(1, parseInt(daysStr, 10) || 3);
  if (!city) {
    return NextResponse.json({ error: "Missing city" }, { status: 400 });
  }

  const tavilyKey = process.env.API_KEY_TAVILY;
  const llmKey = process.env.API_KEY_LLM;

  if (!tavilyKey || !llmKey) {
    return NextResponse.json({ error: "API keys not configured" }, { status: 500 });
  }

  // Step 1: Tavily search for hikes and tours
  const tavilyRes = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: tavilyKey,
      query: `best hiking trails treks outdoor tours guided walks ${city}`,
      max_results: Math.max(5, days + 2),
    }),
    next: { revalidate: 86400 },
  });

  if (!tavilyRes.ok) {
    return NextResponse.json({ treks: [] }, { status: 404 });
  }

  const tavilyData = await tavilyRes.json();
  const results: { title: string; url: string; content: string }[] =
    tavilyData.results ?? [];

  if (results.length === 0) {
    return NextResponse.json({ treks: [] }, { status: 404 });
  }

  // Step 2: LLM (OpenRouter) to structure results into Trek objects
  const rawText = results
    .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
    .join("\n\n");

  const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${llmKey}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-5-haiku",
      messages: [
        {
          role: "user",
          content: `Extract hiking trails, trekking routes, and guided tours near ${city} from these search results.
Return ONLY a valid JSON array:
[
  {
    "id": "trek-1",
    "name": "Trail or Tour Name",
    "description": "2-3 sentence description",
    "address": "location or trailhead area",
    "url": "source url if available, else empty string",
    "tip": "difficulty, duration, or best season"
  }
]
Keep ${days} to ${days + 2} distinct options. Output ONLY the JSON array.

Search results:
${rawText}`,
        },
      ],
    }),
  });

  if (!llmRes.ok) {
    return NextResponse.json({ treks: [] }, { status: 404 });
  }

  const llmData = await llmRes.json();
  const text: string = llmData.choices?.[0]?.message?.content ?? "[]";
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");

  if (jsonStart === -1 || jsonEnd === -1) {
    return NextResponse.json({ treks: [] }, { status: 404 });
  }

  let treks: Trek[] = [];
  try {
    treks = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return NextResponse.json({ treks: [] }, { status: 404 });
  }

  if (treks.length === 0) {
    return NextResponse.json({ treks: [] }, { status: 404 });
  }

  return NextResponse.json({ treks });
}
