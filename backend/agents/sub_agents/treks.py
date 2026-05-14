import json
from utils.api_clients import tavily_search
from utils.llm import async_client, MODEL_HAIKU
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

@traceable(name="Beach Subagent", tags=["subagent", "geography"])
async def fetch_treks(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "treks")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    data = await tavily_search(
        f"best hiking trails treks outdoor tours guided walks {city}",
        max_results=10,
    )
    results = data.get("results", [])
    if not results:
        return []

    raw_text = "\n\n".join(
        f"Title: {r.get('title', '')}\nURL: {r.get('url', '')}\nContent: {r.get('content', '')}"
        for r in results
    )

    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"""Extract hiking trails, trekking routes, and guided tours near {city} from these search results.
Return ONLY a valid JSON array:
[
  {{
    "id": "trek-1",
    "name": "Trail or Tour Name",
    "category": "treks",
    "description": "2-3 sentence description",
    "address": "location or trailhead area",
    "url": "source url if available, else empty string",
    "tip": "difficulty level, duration, best season, or key practical detail"
  }}
]
Keep 6-10 distinct options. Output ONLY the JSON array.

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
