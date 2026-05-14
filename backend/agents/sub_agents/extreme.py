from utils.api_clients import tavily_search
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_extreme(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "extreme")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    data = await tavily_search(
        f"extreme sports adventure activities near {city} skydiving bungee surfing paragliding", 8
    )

    attractions = [
        Attraction(
            id=f"extreme-{i}",
            name=r.get("title", "").split(" - ")[0],
            category="extreme",
            description=str(r.get("content", r.get("snippet", "")))[:250],
            url=r.get("url", ""),
        )
        for i, r in enumerate(data.get("results", []))
    ]

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
