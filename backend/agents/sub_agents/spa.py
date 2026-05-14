import json
from utils.agent_loop import run_agent_loop
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

BUDGET_LABEL = {
    "budget": "affordable budget-friendly",
    "comfort": "mid-range popular",
    "luxury": "luxury high-end",
}

SYSTEM_PROMPT = """You are the Spa & Wellness Agent for Breeze.AI, a travel planning assistant.
Your specialty is identifying the best spa centers, wellness retreats, and massage studios for travelers.

Use the search_web tool to find real, current options for the city and travel dates provided.
After searching, return ONLY a valid JSON array — no extra text, no markdown:
[
  {
    "id": "spa-1",
    "name": "Spa or Wellness Center Name",
    "category": "spa",
    "description": "2-3 sentences about treatments and atmosphere",
    "address": "neighborhood or street address",
    "url": "source url if available, else empty string",
    "tip": "signature treatment, price range, or booking advice"
  }
]
Include 6-10 distinct options that match the requested budget tier."""


@traceable(name="Spa Agent", tags=["subagent", "wellness"])
async def fetch_spa(city: str, budget: str, start_date: str, end_date: str) -> list[Attraction]:
    key = attraction_cache_key(city, "spa")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    budget_words = BUDGET_LABEL.get(budget, BUDGET_LABEL["comfort"])
    user_message = (
        f"Find the best {budget_words} spa and wellness centers in {city} "
        f"for a traveler visiting from {start_date} to {end_date}. "
        f"Include seasonal availability or booking notes where relevant."
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
