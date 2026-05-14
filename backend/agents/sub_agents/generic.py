import asyncio
import json
from utils.api_clients import tavily_search
from utils.parsers import Attraction
from utils.llm import async_client, MODEL_HAIKU
from cache.redis import get_cached, set_cached, attraction_cache_key

_EXTRACT_PROMPT = """You are given raw search results about "{category}" in {city}.
Extract up to 6 specific venue or experience recommendations from the text below.
Return a JSON array. Each item must have:
- "name": exact venue or place name
- "type": short type label (e.g. casino/spa/theme_park/museum/etc.)
- "neighborhood": neighborhood or area if mentioned, else ""
- "description": 1 sentence about what it is or the experience
- "tip": one practical tip (price range, best time to go, booking required, etc.)

Return ONLY the JSON array, no other text.

Search results:
{content}
"""


async def fetch_generic(city: str, category: str, budget: str) -> list[Attraction]:
    key = attraction_cache_key(city, f"generic_{category}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    queries = [
        f"best {category} in {city}",
        f"{category} {city} recommended places 2025",
    ]
    tasks = [tavily_search(q, 5) for q in queries]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    combined_content = []
    for result in raw_results:
        if isinstance(result, Exception):
            continue
        for r in result.get("results", []):
            combined_content.append(
                f"{r.get('title', '')}\n{r.get('content', r.get('snippet', ''))[:400]}"
            )

    if not combined_content:
        return []

    attractions = await _extract_venues(city, category, combined_content)
    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions


async def _extract_venues(city: str, category: str, content_blocks: list[str]) -> list[Attraction]:
    prompt = _EXTRACT_PROMPT.format(
        category=category,
        city=city,
        content="\n\n---\n\n".join(content_blocks),
    )
    response = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()

    try:
        venues = json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("["), raw.rfind("]") + 1
        venues = json.loads(raw[start:end]) if start != -1 else []

    attractions = []
    for i, v in enumerate(venues):
        name = v.get("name", "").strip()
        if not name:
            continue
        neighborhood = v.get("neighborhood", "")
        attractions.append(Attraction(
            id=f"generic-{category}-{city}-{i}",
            name=name,
            category=f"{category}/{v.get('type', category)}",
            description=v.get("description", ""),
            address=f"{neighborhood}, {city}" if neighborhood else city,
            tip=v.get("tip", ""),
        ))

    return attractions
