import asyncio
import httpx
from langsmith import traceable
from utils.api_clients import OVERPASS_BASE
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key

@traceable(name="History Subagent", tags=["subagent", "history"])
async def fetch_history(city: str) -> list[Attraction]:
    key = attraction_cache_key(city, "history")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    # 1. Fetch historic locations from Overpass API
    overpass_query = f"""
    [out:json];
    area[name="{city}"]->.searchArea;
    (
      node["historic"~"monument|castle|ruins"](area.searchArea);
      way["historic"~"monument|castle|ruins"](area.searchArea);
      node["tourism"="museum"](area.searchArea);
      way["tourism"="museum"](area.searchArea);
    );
    out center 12;
    """

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            OVERPASS_BASE,
            params={'data': overpass_query},
            headers={'User-Agent': 'Breeze.AI Hackathon Project'}
        )
        res.raise_for_status()
        data = res.json()

    # 2. Extract locations and fetch Wikipedia extracts in parallel
    raw_places = data.get('elements', [])
    attractions = await asyncio.gather(*[_enrich_from_wiki(p, city) for p in raw_places[:12]], return_exceptions=True)
    
    # Filter out failures
    valid_attractions = [a for a in attractions if isinstance(a, Attraction)]

    await set_cached(key, [a.to_dict() for a in valid_attractions])
    return valid_attractions


async def _enrich_from_wiki(el: dict, city: str) -> Attraction:
    tags = el.get('tags', {})
    name = tags.get('name')
    if not name:
        raise ValueError("No name")

    lat = el.get('lat') or (el.get('center', {}).get('lat'))
    lon = el.get('lon') or (el.get('center', {}).get('lon'))
    
    street = tags.get('addr:street', '')
    housenumber = tags.get('addr:housenumber', '')
    address = f"{housenumber} {street}".strip() if street else city

    attr = Attraction(
        id=str(el.get('id', id(el))),
        name=name,
        category="history",
        description=f"A historical site located in {city}.",
        address=address,
        coordinates={"lat": lat, "lng": lon} if lat and lon else None,
        url=tags.get('website')
    )

    # 3. Fuzzy search Wikipedia to get rich description and image
    wiki_url = "https://en.wikipedia.org/w/api.php"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            wiki_res = await client.get(wiki_url, params={
                "action": "query",
                "generator": "search",
                "gsrsearch": name,
                "gsrlimit": 1,
                "prop": "extracts|pageimages",
                "piprop": "thumbnail",
                "pithumbsize": 800,
                "exintro": "1",
                "explaintext": "1",
                "format": "json"
            }, headers={"User-Agent": "Breeze.AI Hackathon Project"})
            
            wiki_data = wiki_res.json()
            pages = wiki_data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                if page_id != "-1":
                    # Append wiki text to description, keep it within 400 chars
                    extract = page_data.get("extract", "").strip()
                    if extract:
                        attr.description = str(extract)[:400] + ("..." if len(extract) > 400 else "")
                    
                    # Extract image url if available
                    thumbnail = page_data.get("thumbnail", {})
                    if thumbnail and "source" in thumbnail:
                        attr.imageurl = thumbnail["source"]
                        
                    break
    except Exception:
        pass # If Wikipedia fails, we still return the Attraction with the basic description
        
    return attr
