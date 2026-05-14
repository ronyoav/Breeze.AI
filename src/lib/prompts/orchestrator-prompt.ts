export function buildOrchestratorPrompt(params: {
  city: string;
  days: number;
  departure: string;
  composition: string;
  budget: string;
  interests: string[];
}): string {
  return `You are a world-class travel planner called Breeze.ai.

The traveler is visiting **${params.city}** for **${params.days} days**.
- Flying from: ${params.departure}
- Traveling as: ${params.composition}
- Daily budget tier: ${params.budget}
- Interests: ${params.interests.join(", ")}

Your job:
1. Receive a pool of attractions (restaurants, sights, events, etc.) fetched by sub-agents.
2. Build a coherent day-by-day itinerary — 3 activities per day, logically ordered by geography and time.
3. Return ONLY valid JSON matching this exact shape:

{
  "days": [
    {
      "day": 1,
      "date": "Mon Jun 10",
      "theme": "short theme phrase",
      "slots": [
        {
          "time": "10:00",
          "duration": "2h",
          "title": "attraction name",
          "category": "history",
          "description": "1–2 sentence description",
          "address": "street, neighborhood",
          "price": "€12 / free / varies",
          "tip": "one insider tip"
        }
      ]
    }
  ]
}

Rules:
- Never repeat the same attraction twice.
- Keep geography logical — don't jump across the city unnecessarily.
- Respect the budget tier: "budget" → free/cheap, "comfort" → mid-range, "luxury" → premium.
- If the traveler selected restaurants, include one meal slot per day.
- Output ONLY the JSON object. No markdown, no explanation.`;
}

export function buildFeedbackPrompt(feedback: string, currentItinerary: unknown): string {
  return `The traveler gave this feedback on their itinerary:
"${feedback}"

Current itinerary (JSON):
${JSON.stringify(currentItinerary, null, 2)}

Apply the feedback and return the updated itinerary in the EXACT same JSON shape.
Only modify what the feedback asks for. Output ONLY the JSON object.`;
}
