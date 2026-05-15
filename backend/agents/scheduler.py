import json
from typing import Optional
from utils.llm import async_client, MODEL_HAIKU
from langsmith import traceable

SCHEDULER_INSTRUCTIONS = """
=== SCHEDULER AGENT SPECIFIC BEHAVIOR ===
You are an elite Travel Scheduler Agent for Breeze.AI.
Your job is to take a raw pool of categorized attractions and cluster them into a cohesive, day-by-day itinerary.

CLUSTERING LOGIC RULES:
1. COMMON SENSE: Group 2-3 attractions per day that logically flow together. Do not mix vastly conflicting vibes (e.g., a serene church visit followed immediately by a chaotic water park).
2. SPATIAL PROXIMITY: Ensure the clustered attractions are geographically close to each other. Use the `coordinates` or `address` to group them logically.
3. STARTING POINT: The clustered daily activities shouldn't be scattered randomly across the city; they should form a walkable or easily transitable path.
4. PRIORITIZE HIGH SCORES: You must select the top-scoring clusters out of all possible combinations. Use the `subAgentScore` attached to each attraction. If an attraction has a score below 7.0, try to avoid scheduling it unless absolutely necessary for proximity.

ITINERARY INTEGRATION:
Once you have formed these high-scoring clusters, assign each cluster to a specific day of the trip.

OUTPUT SCHEMA:
Return ONLY a valid JSON array of day objects. Do not wrap it in markdown. Do not include conversational text.
[
  {
    "day": 1,
    "date": "Mon Jun 10",
    "theme": "A short descriptive theme for the day (e.g. 'Historic Heart of the City')",
    "scheduled_items": [
      {
        "id": "id1",
        "time": "10:00",
        "duration": "2h"
      }
    ]
  }
]
"""

@traceable(name="Scheduler Agent", tags=["scheduler"])
async def run_scheduler(
    city: str,
    days: int,
    start_date: str,
    attraction_pool: list[dict],
    scheduling_rejections: Optional[str] = None
) -> list[dict]:
    
    # Base user prompt
    user_prompt = (
        f"Create a {days}-day itinerary for a trip to {city} starting on {start_date}.\n"
        f"Here is the pool of curated attractions:\n"
        f"{json.dumps(attraction_pool, indent=2)}\n\n"
    )
    
    # If the user rejected a previous schedule or wants swaps, append it
    if scheduling_rejections:
        user_prompt += (
            f"=== IMPORTANT USER FEEDBACK / REJECTIONS ===\n"
            f"The user has requested the following changes to the schedule:\n"
            f"{scheduling_rejections}\n"
            f"You MUST respect these constraints (swapping days, changing order, etc.) when building the final schedule.\n"
        )
        
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        system=SCHEDULER_INSTRUCTIONS,
        messages=[{"role": "user", "content": user_prompt}]
    )

    text = message.content[0].text if message.content else "[]"
    match = _extract_json_array(text)
    
    if match:
        try:
            return json.loads(match)
        except Exception:
            pass
            
    return []

def _extract_json_array(text: str) -> Optional[str]:
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None
