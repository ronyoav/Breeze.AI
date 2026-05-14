export function buildSchedulerPrompt(params: {
  city: string;
  days: number;
  startDate: string;
  attractionPool: unknown[];
}): string {
  return `You are a scheduling agent for a ${params.days}-day trip to ${params.city} starting ${params.startDate}.

You have been given a pool of attractions. Assign them into a day-by-day schedule.

Attractions pool:
${JSON.stringify(params.attractionPool, null, 2)}

Rules:
- 2–3 activities per day (morning, afternoon, evening when applicable).
- Group nearby attractions on the same day.
- No attraction appears twice.
- Return ONLY valid JSON — an array of day objects:

[
  {
    "day": 1,
    "date": "Mon Jun 10",
    "theme": "short descriptive theme",
    "attractionIds": ["id1", "id2", "id3"]
  }
]

Output ONLY the JSON array.`;
}
