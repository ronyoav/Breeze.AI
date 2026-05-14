import httpx
from utils.api_clients import FOURSQUARE_BASE, foursquare_key
from utils.parsers import Attraction, parse_foursquare_place
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_shopping(city: str, budget: str) -> list[Attraction]:
    key = attraction_cache_key(city, "shopping")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    query = "luxury boutique" if budget == "luxury" else "shopping market"

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{FOURSQUARE_BASE}/search",
            params={"query": query, "near": city, "limit": "15", "categories": "17000,11000"},
            headers={"Authorization": foursquare_key(), "Accept": "application/json"},
        )
        res.raise_for_status()
        data = res.json()

    attractions = [
        Attraction(**{**parse_foursquare_place(p).__dict__, "category": "shopping"})
        for p in data.get("results", [])
    ]

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
