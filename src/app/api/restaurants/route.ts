import { NextRequest, NextResponse } from "next/server";

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  cuisine: string;
  priceRange: string;
  url: string;
  tip?: string;
}

const BUDGET_QUERY: Record<string, string> = {
  budget: "cheap affordable local street food budget-friendly",
  comfort: "mid-range popular local restaurants",
  luxury: "upscale fine dining gourmet restaurants",
};

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const budget = req.nextUrl.searchParams.get("budget") ?? "comfort";
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

  const budgetWords = BUDGET_QUERY[budget] ?? BUDGET_QUERY.comfort;

  const tavilyRes = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: tavilyKey,
      query: `best ${budgetWords} restaurants ${city} must try`,
      max_results: Math.max(5, days + 2),
    }),
    next: { revalidate: 86400 },
  });

  if (!tavilyRes.ok) {
    return NextResponse.json({ restaurants: [] }, { status: 404 });
  }

  const tavilyData = await tavilyRes.json();
  const results: { title: string; url: string; content: string }[] = tavilyData.results ?? [];

  if (results.length === 0) {
    return NextResponse.json({ restaurants: [] }, { status: 404 });
  }

  const rawText = results
    .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
    .join("\n\n");

  const priceLabel =
    budget === "budget" ? "$ (budget-friendly)" : budget === "luxury" ? "$$$ (upscale)" : "$$ (mid-range)";

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
          content: `Extract the best ${priceLabel} restaurants in ${city} from these search results.
Return ONLY a valid JSON array:
[
  {
    "id": "rest-1",
    "name": "Restaurant Name",
    "description": "2-3 sentences about the food and atmosphere",
    "address": "neighborhood or street address",
    "cuisine": "cuisine type",
    "priceRange": "${priceLabel}",
    "url": "source url if available, else empty string",
    "tip": "one insider tip — best dish, when to go, reservation needed, etc."
  }
]
Keep ${days} to ${days + 2} distinct options matching the ${budget} budget tier. Output ONLY the JSON array.

Search results:
${rawText}`,
        },
      ],
    }),
  });

  if (!llmRes.ok) {
    return NextResponse.json({ restaurants: [] }, { status: 404 });
  }

  const llmData = await llmRes.json();
  const text: string = llmData.choices?.[0]?.message?.content ?? "[]";
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");

  if (jsonStart === -1 || jsonEnd === -1) {
    return NextResponse.json({ restaurants: [] }, { status: 404 });
  }

  let restaurants: Restaurant[] = [];
  try {
    restaurants = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return NextResponse.json({ restaurants: [] }, { status: 404 });
  }

  if (restaurants.length === 0) {
    return NextResponse.json({ restaurants: [] }, { status: 404 });
  }

  return NextResponse.json({ restaurants });
}
