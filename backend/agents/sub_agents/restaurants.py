import json
from utils.api_clients import tavily_search
from utils.llm import async_client, MODEL_HAIKU
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable


BUDGET_QUERY = {
    "budget": "cheap affordable local street food budget-friendly",
    "comfort": "mid-range popular local restaurants",
    "luxury": "upscale fine dining gourmet restaurants",
}

@traceable(name="Beach Subagent", tags=["subagent", "geography"])
async def fetch_restaurants(city: str, budget: str, days: int) -> list[Attraction]:
    key = attraction_cache_key(city, "restaurants")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    budget_words = BUDGET_QUERY.get(budget, BUDGET_QUERY["comfort"])
    data = await tavily_search(
        f"best {budget_words} restaurants {city} must try",
        max_results=10,
    )
    results = data.get("results", [])
    if not results:
        return []

    raw_text = "\n\n".join(
        f"Title: {r.get('title', '')}\nURL: {r.get('url', '')}\nContent: {r.get('content', '')}"
        for r in results
    )

    price_label = {"budget": "$ (budget)", "comfort": "$$ (mid-range)", "luxury": "$$$ (upscale)"}.get(budget, "$$")

    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"""Extract the best {price_label} restaurants in {city} from these search results.
Return ONLY a valid JSON array:
[
  {{
    "id": "rest-1",
    "name": "Restaurant Name",
    "category": "restaurants",
    "description": "2-3 sentences about the food and atmosphere",
    "address": "neighborhood or street address",
    "url": "source url if available, else empty string",
    "tip": "best dish, when to go, or whether reservations are needed"
  }}
]
Keep 6-10 distinct options matching the {budget} budget tier. Output ONLY the JSON array.

Search results:
{raw_text}""",
        }],
    )

    text = message.content[0].text if message.content else "[]"
    start, end = text.find("["), text.rfind("]")
    attractions: list[Attraction] = []
    if start != -1 and end != -1:
        try:
            attractions = [Attraction(**a) for a in json.loads(text[start:end + 1])]
        except Exception:
            pass

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
