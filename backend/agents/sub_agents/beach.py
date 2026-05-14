import httpx
from utils.api_clients import GOOGLE_PLACES_BASE, google_key
from utils.parsers import Attraction, parse_google_place
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_beach(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "beach")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{GOOGLE_PLACES_BASE}/textsearch/json",
            params={"query": f"best beaches near {city}", "key": google_key()},
        )
        res.raise_for_status()
        data = res.json()

    attractions = [
        Attraction(**{**parse_google_place(p).__dict__, "category": "beach"})
        for p in data.get("results", [])[:12]
    ]

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
