import asyncio
import httpx
from utils.api_clients import OPENTRIPMAP_BASE, opentripmap_key
from utils.parsers import Attraction, parse_opentripmap_place
from cache.redis import get_cached, set_cached, attraction_cache_key


async def fetch_history(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "history")
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

        radius_res = await client.get(
            f"{OPENTRIPMAP_BASE}/radius",
            params={
                "radius": "10000",
                "lon": geo["lon"],
                "lat": geo["lat"],
                "kinds": "cultural,historic,architecture",
                "rate": "3",
                "limit": "20",
                "format": "json",
                "apikey": opentripmap_key(),
            },
        )
        radius_res.raise_for_status()
        places = radius_res.json()

    # Enrich top 12 with Wikipedia extract
    enriched = await asyncio.gather(*[_enrich(p) for p in places[:12]], return_exceptions=True)
    attractions = [a for a in enriched if isinstance(a, Attraction)]

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions


async def _enrich(place: dict) -> Attraction:
    base = parse_opentripmap_place(place)
    base.category = "history"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            detail_res = await client.get(
                f"{OPENTRIPMAP_BASE}/xid/{place['xid']}",
                params={"apikey": opentripmap_key(), "format": "json"},
            )
            detail = detail_res.json()
        extract = detail.get("wikipedia_extracts", {}).get("text", "")
        if extract:
            base.description = str(extract)[:300]
    except Exception:
        pass
    return base
