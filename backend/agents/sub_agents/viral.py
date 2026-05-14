from datetime import datetime
from utils.api_clients import tavily_search
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_viral(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "viral")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    year = datetime.now().year
    data = await tavily_search(
        f"viral Instagram spots hidden gems must-see {city} {year}", 8
    )

    attractions = [
        Attraction(
            id=f"viral-{i}",
            name=r.get("title", "").split(" - ")[0],
            category="viral",
            description=str(r.get("content", r.get("snippet", "")))[:250],
            url=r.get("url", ""),
        )
        for i, r in enumerate(data.get("results", []))
    ]

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
