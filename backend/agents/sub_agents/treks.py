import json
from utils.agent_loop import run_agent_loop
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

SYSTEM_PROMPT = """You are the Outdoor & Trekking Agent for Breeze.AI, a travel planning assistant.
Your specialty is finding the best hiking trails, trekking routes, guided walks, and nature tours
for travelers who want to explore the outdoors.

Use the search_web tool to find real, current options for the given city or region.
After searching, return ONLY a valid JSON array — no extra text, no markdown:
[
  {
    "id": "trek-1",
    "name": "Trail or Tour Name",
    "category": "treks",
    "description": "2-3 sentences about the route and scenery",
    "address": "location or trailhead area",
    "url": "source url if available, else empty string",
    "tip": "difficulty level, duration, best season, or key practical detail"
  }
]
Include 6-10 distinct options ranging from easy walks to challenging trails."""


@traceable(name="Treks Agent", tags=["subagent", "outdoor"])
async def fetch_treks(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "treks")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    user_message = (
        f"Find the best hiking trails, trekking routes, and guided outdoor tours "
        f"in and around {city}. Include a mix of difficulties."
    )

    text = await run_agent_loop(SYSTEM_PROMPT, user_message)
    start, end = text.find("["), text.rfind("]")
    attractions: list[Attraction] = []
    if start != -1 and end != -1:
        try:
            attractions = [Attraction(**a) for a in json.loads(text[start:end + 1])]
        except Exception:
            pass

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
