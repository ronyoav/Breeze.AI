import httpx
from langsmith import traceable
from utils.api_clients import OVERPASS_BASE
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key

@traceable(name="Shopping Subagent", tags=["subagent", "shopping"])
async def fetch_shopping(city: str, budget: str) -> list[Attraction]:
    key = attraction_cache_key(city, "shopping")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    shop_types = "boutique|jewelry|watches" if budget == "luxury" else "mall|department_store|clothes"

    overpass_query = f"""
    [out:json];
    area[name="{city}"]->.searchArea;
    (
      node["shop"~"{shop_types}"](area.searchArea);
      way["shop"~"{shop_types}"](area.searchArea);
    );
    out center 15;
    """

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            OVERPASS_BASE,
            params={'data': overpass_query},
            headers={'User-Agent': 'Breeze.AI Hackathon Project'}
        )
        res.raise_for_status()
        data = res.json()

    attractions = []
    for el in data.get('elements', []):
        tags = el.get('tags', {})
        name = tags.get('name')
        if not name:
            continue

        lat = el.get('lat') or (el.get('center', {}).get('lat'))
        lon = el.get('lon') or (el.get('center', {}).get('lon'))

        street = tags.get('addr:street', '')
        housenumber = tags.get('addr:housenumber', '')
        address = f"{housenumber} {street}".strip() if street else city

        attr = Attraction(
            id=str(el.get('id', id(el))),
            name=name,
            category="shopping",
            description=f"{tags.get('shop', 'Shop').replace('_', ' ').title()} located in {city}.",
            address=address,
            coordinates={"lat": lat, "lng": lon} if lat and lon else None,
            url=tags.get('website')
        )
        attractions.append(attr)

    await set_cached(key, [a.to_dict() for a in attractions])
    return attractions
