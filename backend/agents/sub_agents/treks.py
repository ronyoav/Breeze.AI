import httpx
from utils.api_clients import OPENTRIPMAP_BASE, opentripmap_key
from utils.parsers import Attraction, parse_opentripmap_place
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_treks(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "treks")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    async with httpx.AsyncClient(timeout=15) as client:
        geo_res = await client.get(
            f"{OPENTRIPMAP_BASE}/geoname",
            params={"name": city, "apikey": opentripmap_key()},
        )
        geo_res.raise_for_status()
        geo = geo_res.json()

        res = await client.get(
            f"{OPENTRIPMAP_BASE}/radius",
            params={
                "radius": "30000",
                "lon": geo["lon"],
                "lat": geo["lat"],
                "kinds": "natural,hiking,beaches,parks",
                "rate": "2",
                "limit": "15",
                "format": "json",
                "apikey": opentripmap_key(),
            },
        )
        res.raise_for_status()
        places = res.json()

    attractions = [
        Attraction(**{**parse_opentripmap_place(p).__dict__, "category": "treks"})
        for p in places[:12]
    ]

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
