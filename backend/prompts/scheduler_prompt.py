import json


def build_scheduler_prompt(
    city: str,
    days: int,
    start_date: str,
    attraction_pool: list,
) -> str:
    return f"""You are a scheduling agent for a {days}-day trip to {city} starting {start_date}.

You have been given a pool of attractions. Assign them into a day-by-day schedule.

Attractions pool:
{json.dumps(attraction_pool, indent=2)}

Rules:
- 2–3 activities per day (morning, afternoon, evening when applicable).
- Group nearby attractions on the same day.
- No attraction appears twice.
- Return ONLY valid JSON — an array of day objects:

[
  {{
    "day": 1,
    "date": "Mon Jun 10",
    "theme": "short descriptive theme",
    "attraction_ids": ["id1", "id2", "id3"]
  }}
]

Output ONLY the JSON array."""
