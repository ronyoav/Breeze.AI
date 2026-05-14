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

function parseLocal(dStr: string): Date {
  const match = dStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  
  if (!/\d{4}/.test(dStr)) {
    const now = new Date();
    const attempt = new Date(`${dStr} ${now.getFullYear()}`);
    if (!isNaN(attempt.getTime())) {
      const attemptVal = attempt.getMonth() * 100 + attempt.getDate();
      const nowVal = now.getMonth() * 100 + now.getDate();
      if (attemptVal < nowVal) {
        attempt.setFullYear(now.getFullYear() + 1);
      }
      return attempt;
    }
  }

  const d = new Date(dStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function getTrueDate(startDate: string, dayIndex: number): string {
  const d = parseLocal(startDate);
  const offset = isNaN(dayIndex) ? 0 : dayIndex;
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function parseTripDate(label: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;
  const now = new Date();
  const attempt = new Date(`${label} ${now.getFullYear()}`);
  if (!isNaN(attempt.getTime())) {
    const attemptVal = attempt.getMonth() * 100 + attempt.getDate();
    const nowVal = now.getMonth() * 100 + now.getDate();
    if (attemptVal < nowVal) attempt.setFullYear(now.getFullYear() + 1);
    
    const yyyy = attempt.getFullYear();
    const mm = String(attempt.getMonth() + 1).padStart(2, '0');
    const dd = String(attempt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

    let mergedPool = (pool ?? []) as AttractionItem[];

    // ---------- FETCH path ----------
    if (mode === "FETCH") {
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

      const origin = req.nextUrl.origin;
      const city = encodeURIComponent(answers.destination);
      const startDate = parseTripDate(answers.dates.start);
      const endDate = parseTripDate(answers.dates.end);

      const freshResults = await Promise.allSettled(
        cats.map(async (cat): Promise<AttractionItem[]> => {
          try {
            let url: string;
            const days = answers.dates.days;
            if (cat === "restaurants") url = `${origin}/api/restaurants?city=${city}&budget=${answers.budget}&days=${days}`;
            else if (cat === "treks") url = `${origin}/api/treks?city=${city}&days=${days}`;
            else if (cat === "music") url = `${origin}/api/concerts?city=${city}&startDate=${startDate}&endDate=${endDate}&days=${days}`;
            else url = `${origin}/api/attractions?city=${city}&category=${cat}&budget=${answers.budget}&days=${days}`;
            const r = await fetch(url);
            const d = await r.json();
            return (d.restaurants ?? d.treks ?? d.concerts ?? d.attractions ?? []) as AttractionItem[];
          } catch { return []; }
        })
      );

      const freshItems = freshResults.flatMap(r => r.status === "fulfilled" ? r.value : []);
      const refreshedCats = new Set(cats);

      mergedPool = [
        ...mergedPool.filter(item => {
          const cat = item.id?.split("-")[0] ?? "";
          return !refreshedCats.has(cat);
        }),
        ...freshItems,
      ];
    }

    // ---------- UNIFIED REVISE path ----------
    const prompt = `You are Breeze.ai, a travel planner. Apply the user's change request to the current itinerary.
    
CRITICAL RULES:
1. DO NOT remove or add days. The number of days MUST remain exactly ${answers.dates.days}.
2. Only add, remove, or swap specific activities as requested. Keep the rest of the schedule intact as much as possible.
3. You can pull new activities from the ATTRACTION POOL if needed.
4. Output ONLY valid JSON — an array of days with slots. 
5. For each slot, ONLY output "time", "duration", "id" (matching an id from the pool), and "category". DO NOT output title, description, address, price, or tip.
6. If you cannot fulfill the request (e.g. no suitable attractions), add a friendly "message" field at the root of the JSON.

Change request: "${feedback}"

ATTRACTION POOL:
${JSON.stringify(mergedPool)}

CURRENT ITINERARY (for reference):
${JSON.stringify({ days: itinerary.days.map((d, i) => ({ ...d, date: getTrueDate(answers.dates.start, (d.day || i + 1) - 1), slots: d.slots.map(s => ({ time: s.time, duration: s.duration, id: s.id, category: s.category })) })) }, null, 2)}

Return ONLY valid JSON matching this shape:
{"days":[{"day":1,"date":"Thu, May 21, 2026","theme":"...","slots":[{"time":"09:30","duration":"2h","id":"...","category":"..."}]}], "message": "..."}`;

    const updatedText = await llm(prompt, 8192, llmKey);
    const jsonMatch = updatedText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : itinerary;

    // Post-process slots
    if (result.days && Array.isArray(result.days)) {
      for (const day of result.days) {
        if (day.slots && Array.isArray(day.slots)) {
          for (const slot of day.slots) {
            const item: any = mergedPool.find((i: any) => i.id === slot.id);
            if (item) {
              slot.title = item.name || "Unknown";
              slot.description = item.description || "";
              slot.address = item.address || "";
              slot.price = item.priceRange || "Varies";
              slot.tip = item.tip || "";
              slot.url = item.url || "";
            } else {
              // fallback to old slot if id missing or LLM hallucinated
              const oldSlot = itinerary.days.flatMap(d => d.slots).find(s => s.id === slot.id);
              if (oldSlot) {
                Object.assign(slot, oldSlot);
              } else if (!slot.title) {
                slot.title = "Unknown Activity";
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ...result, pool: mergedPool }, { headers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown", days: [] },
      { status: 500 }
    );
  }
}
