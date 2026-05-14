import { NextRequest, NextResponse } from "next/server";
import type { GeneratedItinerary, AttractionItem, TripAnswers } from "@/components/types";

export const maxDuration = 120;

const LLM_URL = "https://openrouter.ai/api/v1/chat/completions";
const LLM_MODEL = "anthropic/claude-3-5-haiku";

async function llm(content: string, maxTokens: number, apiKey: string): Promise<string> {
  const res = await fetch(LLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: LLM_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content }] }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseTripDate(label: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;
  const now = new Date();
  const attempt = new Date(`${label} ${now.getFullYear()}`);
  if (!isNaN(attempt.getTime())) {
    if (attempt < now) attempt.setFullYear(now.getFullYear() + 1);
    return attempt.toISOString().split("T")[0];
  }
  return now.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  try {
    const { feedback, itinerary, answers, pool }: {
      feedback: string;
      itinerary: GeneratedItinerary;
      answers: TripAnswers;
      pool?: unknown[];
    } = await req.json();

    const llmKey = process.env.API_KEY_LLM;
    if (!llmKey) return NextResponse.json({ days: [] }, { status: 500 });

    // Step 1: classify — RESCHEDULE or FETCH
    const classifyText = await llm(
      `Classify this travel itinerary change request with ONE word only — FETCH or RESCHEDULE.
FETCH = user wants new/different types of places or activities ("add beach", "find a restaurant", "book a concert", "more seafood", "visit a spa")
RESCHEDULE = timing, pacing, reordering, removing or swapping specific slots ("more relaxed mornings", "skip the museum", "swap days 2 and 3", "earlier dinners")
Request: "${feedback}"`,
      10, llmKey
    );
    const mode: "FETCH" | "RESCHEDULE" = classifyText.trim().toUpperCase().includes("FETCH") ? "FETCH" : "RESCHEDULE";

    const headers = { "x-revise-mode": mode };

    // ---------- RESCHEDULE path ----------
    if (mode === "RESCHEDULE") {
      const updatedText = await llm(
        `Apply the following change to this travel itinerary. Only modify what is asked — keep the exact same JSON shape.
Return ONLY the JSON object, no markdown fences.

Change request: "${feedback}"

Current itinerary:
${JSON.stringify({ days: itinerary.days }, null, 2)}`,
        4096, llmKey
      );
      const jsonMatch = updatedText.match(/\{[\s\S]*\}/);
      const updated: GeneratedItinerary = jsonMatch ? JSON.parse(jsonMatch[0]) : itinerary;
      return NextResponse.json({ ...updated, pool }, { headers });
    }

    // ---------- FETCH path ----------
    // Identify which categories need fresh data
    const catText = await llm(
      `Which attraction categories need fresh data for this request?
Available: restaurants, treks, music, nightlife, history, sports, extreme, beach, spa, shopping, viral
Return ONLY a JSON array of strings, e.g. ["beach","restaurants"]
Request: "${feedback}"`,
      100, llmKey
    );
    let cats: string[] = [];
    try {
      const s = catText.indexOf("["), e = catText.lastIndexOf("]");
      if (s !== -1) cats = JSON.parse(catText.slice(s, e + 1));
    } catch { cats = []; }
    if (cats.length === 0) cats = answers.interests.slice(0, 2);

    // Fetch fresh attractions for those categories
    const origin = req.nextUrl.origin;
    const city = encodeURIComponent(answers.destination);
    const startDate = parseTripDate(answers.dates.start);
    const endDate = parseTripDate(answers.dates.end);

    const freshResults = await Promise.allSettled(
      cats.map(async (cat): Promise<AttractionItem[]> => {
        try {
          let url: string;
          if (cat === "restaurants") url = `${origin}/api/restaurants?city=${city}&budget=${answers.budget}`;
          else if (cat === "treks") url = `${origin}/api/treks?city=${city}`;
          else if (cat === "music") url = `${origin}/api/concerts?city=${city}&startDate=${startDate}&endDate=${endDate}`;
          else url = `${origin}/api/attractions?city=${city}&category=${cat}&budget=${answers.budget}`;
          const r = await fetch(url);
          const d = await r.json();
          return (d.restaurants ?? d.treks ?? d.concerts ?? d.attractions ?? []) as AttractionItem[];
        } catch { return []; }
      })
    );

    const freshItems = freshResults.flatMap(r => r.status === "fulfilled" ? r.value : []);
    const refreshedCats = new Set(cats);
    const oldPool = (pool ?? []) as AttractionItem[];

    // Merge: keep existing items whose category isn't being refreshed
    const mergedPool: AttractionItem[] = [
      ...oldPool.filter(item => {
        const cat = (item as AttractionItem).id?.split("-")[0] ?? "";
        return !refreshedCats.has(cat);
      }),
      ...freshItems,
    ];

    // Re-schedule with merged pool + user feedback as highest priority constraint
    const scheduleRes = await fetch(`${origin}/api/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: mergedPool,
        city: answers.destination,
        days: answers.dates.days,
        startDate: answers.dates.start,
        composition: answers.composition ?? "friends",
        budget: answers.budget,
        interests: [...new Set([...answers.interests, ...cats])],
        ages: answers.ages,
        userRequest: feedback,
      }),
    });

    const updated: GeneratedItinerary = await scheduleRes.json();
    return NextResponse.json({ ...updated, pool: mergedPool }, { headers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown", days: [] },
      { status: 500 }
    );
  }
}
