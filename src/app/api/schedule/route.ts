import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

function getMonthName(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "unknown month";
  return d.toLocaleString("en-US", { month: "long" });
}

function buildAgeContext(ages: string | undefined, composition: string): string {
  const agesNote = ages ? ` (ages: ${ages})` : "";

  if (composition === "family") {
    // Try to detect if kids are young (< 12) from the ages string
    const hasYoungKids = ages && /\b([0-9]|1[01])\b/.test(ages);
    if (hasYoungKids) {
      return `Family with young children${agesNote}:
- Choose easy, flat walks and short hikes (max 1–2 h, no steep terrain).
- Prioritise interactive attractions: zoos, aquariums, playgrounds, kid-friendly museums.
- Schedule an afternoon break / downtime slot (14:00–16:00) — young kids need rest.
- Dinner early: 18:30 or 19:00 rather than 20:00.
- Avoid extreme sports, nightlife, crowded late-night venues, and very long travel between sites.
- Add notes in the tip field about stroller access or child admission prices.`;
    }
    return `Family with older children / teens${agesNote}:
- Hikes can be moderate (2–3 h), but avoid very strenuous or technical routes.
- Include a mix of active and cultural activities teens will find engaging.
- No nightlife or bar-heavy evenings; dinner by 20:00.
- Teens often enjoy adventure activities (zip-line, kayaking, bike tours) — include these if available.`;
  }

  if (composition === "couple") {
    return `Romantic couple${agesNote}:
- Lean into scenic, atmospheric, and intimate experiences: rooftop views, sunset spots, candlelit dinner restaurants, boat rides, wine tastings.
- Avoid large impersonal group tours where possible; prefer private or small-group options.
- Dinner is a highlight — choose a restaurant with ambience: terrace, view, or live music.
- Include at least one slow morning (start at 10:00) for a leisurely breakfast or café stop.
- Spa or wellness slots are a great afternoon option for couples.`;
  }

  if (composition === "solo") {
    return `Solo traveler${agesNote}:
- Group walking tours, cooking classes, and hostels' social activities are great ways to meet people — mention these in tips.
- Flexible pacing: can do back-to-back museums or spontaneous detours.
- Safety note: for evening slots mention well-lit, central areas.
- Lunch can be quick (street food, market) to save time and budget.
- Include at least one local neighbourhood wander slot — solo travel is perfect for exploring on foot.`;
  }

  if (composition === "friends") {
    // Parse rough age range if available
    const avgAge = ages ? extractAverageAge(ages) : null;
    if (avgAge !== null && avgAge >= 50) {
      return `Group of friends${agesNote} (mature travelers):
- Choose comfortable, scenic activities over high-intensity ones.
- Moderate walking tours, wine or food tours, cultural experiences, cooking classes.
- Include rest time between sites; avoid very long walking stretches without a break.
- Dinner is a social centrepiece — choose a lively restaurant with a good wine list.
- Avoid extreme sports, very loud nightlife; instead opt for jazz bars, rooftop bars, or local tavernas.`;
    }
    if (avgAge !== null && avgAge <= 28) {
      return `Group of young friends${agesNote}:
- High energy schedule: pack in adventure, nightlife, and social hotspots.
- Include one nightlife or bar-hopping slot (start late, 21:00+) if nightlife is in interests.
- Street food, food markets, and casual restaurants over formal dining.
- Adventure activities (surfing, hiking, biking) are very welcome.
- Social, Instagrammable spots and viral locations fit perfectly.`;
    }
    return `Group of friends${agesNote}:
- Balanced mix of cultural sights, active outings, good food, and social evenings.
- One group activity per day that encourages interaction: food tour, cooking class, boat trip.
- Dinner at a lively, social restaurant — tapas-style, shared plates, or a fun local spot.
- Can include one moderate nightlife slot if interests allow.`;
  }

  // Fallback
  return ages ? `Travelers ages: ${ages}. Tailor difficulty and timing to this group.` : "Flexible group — balanced schedule.";
}

function extractAverageAge(ages: string): number | null {
  const nums = ages.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const parsed = nums.map(Number).filter((n) => n > 0 && n < 120);
  if (parsed.length === 0) return null;
  return parsed.reduce((a, b) => a + b, 0) / parsed.length;
}

function buildSchedulePrompt(params: {
  items: unknown[];
  city: string;
  days: number;
  startDate: string;
  composition: string;
  budget: string;
  interests: string[];
  ages?: string;
  userRequest?: string;
}): string {
  const month = getMonthName(params.startDate);
  const ageContext = buildAgeContext(params.ages, params.composition);
  const userSection = params.userRequest
    ? `\nHIGHEST PRIORITY — apply this before all other rules:\n"${params.userRequest}"\n`
    : "";

  return `You are Breeze.ai — a world-class travel planner. Build a personally crafted, day-by-day calendar itinerary from the attraction pool below.${userSection}

TRIP
Destination: ${params.city} | ${params.days} days starting ${params.startDate} (${month})
Travelers: ${params.composition}${params.ages ? ` · ages ${params.ages}` : ""}
Budget: ${params.budget} (budget→free/cheap · comfort→mid-range · luxury→premium)
Interests: ${params.interests.join(", ")}

SEASONAL CONTEXT (${month})
Factor in local weather, crowd levels, and best times of day for outdoor/hike/beach slots. Add a seasonal note in the tip for any weather-sensitive activity.

GROUP PROFILE — apply every point strictly:
${ageContext}

RULES
1. 3–4 slots per day, ordered morning → afternoon → evening.
2. Cluster geographically close venues on the same day — minimise transit.
3. No venue repeated across the trip.
4. Honour the budget tier in every price field.
5. Realistic durations: landmark 1.5–2h · walk 1–1.5h · tour/class 2–3h · hike 3–4h · beach 2.5h · spa 1.5h · meal 1–1.5h.
6. First slot: 09:00–10:30.
7. Every tip must be concrete and specific (booking tip, best dish, ideal time, local secret).
8. Day theme: short and evocative, reflecting both geography and group profile.
9. Descriptions: 1–2 vivid sentences per slot — write as if recommending to a friend.

CRITICAL: You MUST produce exactly ${params.days} day objects in the "days" array — one per day, no more, no less.

Return ONLY valid JSON — no markdown, no explanation:
{"days":[{"day":1,"date":"Mon May 14","theme":"...","slots":[{"time":"09:30","duration":"2h","title":"...","category":"history","description":"...","address":"...","price":"...","tip":"..."}]}]}

POOL:
${JSON.stringify(params.items)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, city, days, startDate, composition, budget, interests, ages, userRequest } = body;

    const llmKey = process.env.API_KEY_LLM;
    if (!llmKey) return NextResponse.json({ days: [] }, { status: 500 });

    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${llmKey}` },
      body: JSON.stringify({
        model: "anthropic/claude-3-5-haiku",
        max_tokens: 8192,
        messages: [{ role: "user", content: buildSchedulePrompt({ items, city, days, startDate, composition, budget, interests, ages, userRequest }) }],
      }),
    });

    if (!llmRes.ok) return NextResponse.json({ days: [] }, { status: 500 });

    const llmData = await llmRes.json();
    const text: string = llmData.choices?.[0]?.message?.content ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { days: [] };

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
