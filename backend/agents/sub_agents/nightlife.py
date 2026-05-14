import asyncio
import httpx
from utils.api_clients import FOURSQUARE_BASE, foursquare_key, tavily_search
from utils.parsers import Attraction, parse_foursquare_place
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_nightlife(city: str, budget: str) -> list[Attraction]:
    key = attraction_cache_key(city, "nightlife")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    fsq_task = _fetch_foursquare(city)
    tavily_task = tavily_search(f"best bars and nightlife in {city} 2025", 5)
    fsq_result, tavily_result = await asyncio.gather(fsq_task, tavily_task, return_exceptions=True)

    attractions: list[Attraction] = []

    if not isinstance(fsq_result, Exception):
        attractions.extend(fsq_result)

    if not isinstance(tavily_result, Exception):
        for i, r in enumerate(tavily_result.get("results", [])):
            attractions.append(Attraction(
                id=f"tavily-nightlife-{i}",
                name=r.get("title", "").split(" - ")[0],
                category="nightlife",
                description=str(r.get("content", r.get("snippet", "")))[:200],
                url=r.get("url", ""),
            ))

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions


async def _fetch_foursquare(city: str) -> list[Attraction]:
    params = {
        "query": "bar nightclub",
        "near": city,
        "limit": "15",
        "categories": "10032,13003",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{FOURSQUARE_BASE}/search",
            params=params,
            headers={"Authorization": foursquare_key(), "Accept": "application/json"},
        )
        res.raise_for_status()
        data = res.json()

    return [
        Attraction(**{**parse_foursquare_place(p).__dict__, "category": "nightlife"})
        for p in data.get("results", [])
    ]
