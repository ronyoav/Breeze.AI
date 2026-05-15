import json
from utils.llm import client

from agents.attraction_manager import run_attraction_manager
from agents.scheduler import run_scheduler
from prompts.orchestrator_prompt import build_orchestrator_prompt, build_feedback_prompt


async def generate_itinerary(
    city: str,
    departure: str,
    start_date: str,
    end_date: str,
    days: int,
    composition: str,
    budget: str,
    interests: list[str],
    scheduling_rejections: str = None,
) -> dict:
    # Step 1: fetch attractions (async, parallel sub-agents)
    input_data = {
        "location": {"city": city},
        "budget": budget,
        "groupStructure": composition,
        "interests": interests,
        "dates": {"start": start_date, "end": end_date},
        "daysNumber": days,
        "departure": departure
    }
    
    pool = await run_attraction_manager(input_data)

    # Step 2: schedule into days (async Haiku call)
    schedule = await run_scheduler(
        city=city,
        days=days,
        start_date=start_date,
        attraction_pool=pool,
        scheduling_rejections=scheduling_rejections
    )

    # Build lookup map from the nested pool structure: [{"type": "history", "results": [...]}, ...]
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
                # Merge the schedule timing info with the full attraction object
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

    # Step 3: Orchestrator builds final narrative (Sonnet)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": (
                build_orchestrator_prompt(
                    city=city,
                    days=days,
                    departure=departure,
                    composition=composition,
                    budget=budget,
                    interests=interests,
                )
                + f"\n\nScheduled attractions by day:\n{json.dumps(scheduled, indent=2)}"
            ),
        }],
    )

    text = message.content[0].text if message.content else "{}"
    match = _extract_json_object(text)
    return json.loads(match) if match else {"days": []}


def refine_feedback(feedback: str, current_itinerary: dict) -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": build_feedback_prompt(feedback, current_itinerary),
        }],
    )

    text = message.content[0].text if message.content else "{}"
    match = _extract_json_object(text)
    return json.loads(match) if match else current_itinerary


from typing import Optional

def _extract_json_object(text: str) -> Optional[str]:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None
