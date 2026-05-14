import httpx
from utils.api_clients import GOOGLE_PLACES_BASE, google_key
from utils.parsers import Attraction, parse_google_place
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_restaurants(city: str, budget: str, days: int) -> list[Attraction]:
    key = attraction_cache_key(city, "restaurants")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    price_map = {"budget": "1", "comfort": "2", "luxury": "3"}
    params = {
        "query": f"best restaurants in {city}",
        "type": "restaurant",
        "key": google_key(),
    }
    if budget in price_map:
        params["minprice"] = price_map[budget]

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{GOOGLE_PLACES_BASE}/textsearch/json", params=params)
        res.raise_for_status()
        data = res.json()

    attractions = [
        Attraction(**{**parse_google_place(p).__dict__, "category": "restaurants"})
        for p in data.get("results", [])[:15]
    ]
    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
