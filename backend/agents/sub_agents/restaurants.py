import json
from utils.agent_loop import run_agent_loop
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

BUDGET_LABEL = {
    "budget": "cheap affordable local street food and budget-friendly",
    "comfort": "mid-range popular local",
    "luxury": "upscale fine dining gourmet",
}

SYSTEM_PROMPT = """You are the Restaurant & Food Agent for Breeze.AI, a travel planning assistant.
Your specialty is discovering the best dining experiences that match a traveler's budget and taste:
from local street food and hidden gems to upscale fine dining.

Use the search_web tool to find real, current restaurant options for the given city and budget.
After searching, return ONLY a valid JSON array — no extra text, no markdown:
[
  {
    "id": "rest-1",
    "name": "Restaurant Name",
    "category": "restaurants",
    "description": "2-3 sentences about the food and atmosphere",
    "address": "neighborhood or street address",
    "url": "source url if available, else empty string",
    "tip": "best dish, when to go, or whether reservations are needed"
  }
]
Include 6-10 distinct options that clearly match the requested budget tier."""


@traceable(name="Restaurants Agent", tags=["subagent", "food"])
async def fetch_restaurants(city: str, budget: str, days: int) -> list[Attraction]:
    key = attraction_cache_key(city, "restaurants")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    budget_words = BUDGET_LABEL.get(budget, BUDGET_LABEL["comfort"])
    price_label = {"budget": "$ (budget)", "comfort": "$$ (mid-range)", "luxury": "$$$ (upscale)"}.get(budget, "$$")

    user_message = (
        f"Find the best {budget_words} restaurants in {city} for a {days}-day trip. "
        f"The traveler has a {price_label} budget. Include must-try local spots."
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
