import json
from typing import Optional
from utils.llm import async_client, MODEL_HAIKU
from agents.attraction_manager import run_attraction_manager
from agents.scheduler import run_scheduler
from langsmith import traceable

ROUTER_INSTRUCTIONS = """
You are a feedback routing agent. The user has rejected or requested changes to their generated travel itinerary.
Your job is to read their feedback string and separate it into two specific categories:
1. "attractions_rejections": Feedback related to the types of activities, specific places they hate/want, budget complaints, or demographic mismatches.
2. "scheduling_rejections": Feedback related to the order of days, swapping days, changing times, or pacing.

Return EXACTLY a JSON object with these two keys. If a category doesn't apply, leave the value as an empty string.
{
  "attractions_rejections": "...",
  "scheduling_rejections": "..."
}
"""

ORCHESTRATOR_INSTRUCTIONS = """
You are the elite Master Orchestrator for Breeze.AI.
Your job is to take the clustered, scheduled attractions and weave them into a beautiful, human-readable JSON narrative.
You will receive the user profile and the day-by-day scheduled attractions.

OUTPUT SCHEMA:
Return ONLY a valid JSON object matching this structure:
{
  "days": [
    {
      "day": 1,
      "date": "2026-08-15",
      "title": "A short descriptive title for the day",
      "summary": "A 1-2 sentence compelling summary of what the day entails",
      "activities": [
        {
          "time": "10:00",
          "duration": "2h",
          "title": "Exact name of attraction",
          "category": "history",
          "description": "The exact description provided in the attraction object",
          "address": "The exact address",
          "price": "Estimate the cost based on the budget tier",
          "tip": "Write a unique, highly personalized pro-tip for this user profile",
          "imageurl": "The exact image URL provided in the attraction object, or null if not available"
        }
      ]
    }
  ]
}
"""

@traceable(name="Master Orchestrator", tags=["orchestrator"])
async def generate_itinerary(
    input_data: dict,
    user_rejections: Optional[str] = None,
    previous_pool: Optional[list[dict]] = None
) -> dict:
    
    attractions_rejections = ""
    scheduling_rejections = ""
    
    # 1. Parse user rejections if provided
    if user_rejections:
        message = await async_client.messages.create(
            model=MODEL_HAIKU,
            max_tokens=1000,
            system=ROUTER_INSTRUCTIONS,
            messages=[{"role": "user", "content": f"Feedback:\n{user_rejections}"}]
        )
        text = message.content[0].text if message.content else "{}"
        match = _extract_json_object(text)
        if match:
            try:
                parsed = json.loads(match)
                attractions_rejections = parsed.get("attractions_rejections", "")
                scheduling_rejections = parsed.get("scheduling_rejections", "")
                print(f"\n[ROUTER LOG] Separated Attraction Rejections: '{attractions_rejections}'")
                print(f"[ROUTER LOG] Separated Scheduling Rejections: '{scheduling_rejections}'\n")
            except Exception as e:
                print(f"[ROUTER LOG] Error parsing JSON: {e}")

    # 2. Handle the Attraction Pool
    pool = previous_pool
    if not pool or attractions_rejections:
        # If we have no pool, OR if the user rejected attractions (requiring a rescore/refetch)
        pool = await run_attraction_manager(
            input_data=input_data,
            previous_output=previous_pool,
            user_prompt=attractions_rejections if attractions_rejections else None
        )

    location = input_data.get("location", {})
    city = location.get("city", "")
    days = input_data.get("daysNumber", 3)
    start_date = input_data.get("dates", {}).get("start", "")

    # 3. Handle the Scheduler
    schedule = await run_scheduler(
        city=city,
        days=days,
        start_date=start_date,
        attraction_pool=pool,
        scheduling_rejections=scheduling_rejections if scheduling_rejections else None
    )

    # 4. Map the IDs to the full objects
    pool_map = {}
    for category in pool:
        for attr in category.get("results", []):
            pool_map[attr.get("id")] = attr

    scheduled = []
    for day in schedule:
        mapped_items = []
        for item in day.get("scheduled_items", []):
            item_id = item.get("id")
            if item_id in pool_map:
                mapped_items.append({
                    "time": item.get("time"),
                    "duration": item.get("duration"),
                    "category": pool_map[item_id].get("category"),
                    "attractionObj": pool_map[item_id]
                })
        scheduled.append({
            "day": day.get("day"),
            "date": day.get("date"),
            "theme": day.get("theme"),
            "attractions": mapped_items
        })

    # 5. Final Orchestrator Narrative Generation
    user_prompt = (
        f"User Profile:\n{json.dumps(input_data, indent=2)}\n\n"
        f"Scheduled Attractions by Day:\n{json.dumps(scheduled, indent=2)}\n"
    )
    
    # We use Claude Haiku for the final narrative pass because it is incredibly fast
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=8000,
        system=ORCHESTRATOR_INSTRUCTIONS,
        messages=[{"role": "user", "content": user_prompt}]
    )

    text = message.content[0].text if message.content else "{}"
    match = _extract_json_object(text)
    return json.loads(match) if match else {"days": []}


def _extract_json_object(text: str) -> Optional[str]:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None
