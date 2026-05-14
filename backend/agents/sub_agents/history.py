import json
import asyncio
import httpx
from langsmith import traceable
from utils.api_clients import OVERPASS_BASE
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object

HISTORY_INSTRUCTIONS = """
=== HISTORY AGENT SPECIFIC BEHAVIOR ===
You are evaluating historical sites, monuments, ruins, and museums.
- FATIGUE & AGES: History tours can be exhausting. If the `groupStructure` contains elderly individuals (65+) or toddlers (under 5), prioritize indoor museums with seating or easily accessible monuments. If the group is young and energetic, you may highly score massive archaeological sites or ruins that require walking.
- WEATHER AWARENESS: Consider the nature of the historical site. If it is an outdoor ruin, make sure to add practical advice in the `notes` field (e.g., "Bring water and sunscreen as there is no shade").
- DESCRIPTION ENRICHMENT: Your `description` field must NOT just be a boring Wikipedia summary. Frame it dynamically for the user. Example: Instead of "This was built in 1500", write "Step back into the 1500s at this massive fortress, a perfect afternoon exploration for your family."
"""

@traceable(name="History Subagent", tags=["subagent", "history"])
async def fetch_history(user_profile: dict) -> list[Attraction]:
    location = user_profile.get("location", {})
    city = location.get("city", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"history_{session_id}")
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

    # 2. Extract locations and fetch Wikipedia extracts in parallel
    raw_places = data.get('elements', [])
    enriched_attractions = await asyncio.gather(*[_enrich_from_wiki(p, city) for p in raw_places[:15]], return_exceptions=True)
    
    # Filter out failures and convert to dict
    valid_raw = [a.to_dict() for a in enriched_attractions if isinstance(a, Attraction)]
    
    if not valid_raw:
        return []

    # 3. Build the dynamic prompt using the Injector
    system_prompt = build_subagent_prompt(user_profile, "history", HISTORY_INSTRUCTIONS)
    
    # 4. Call Claude to score, filter, and format the JSON
    raw_json_str = json.dumps(valid_raw, indent=2)
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Raw historic sites:\n{raw_json_str}"}]
    )

    text = message.content[0].text if message.content else "{}"
    json_match = extract_json_object(text)
    
    final_attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "history"
                if "id" not in item:
                    item["id"] = "generated_id"
                final_attractions.append(Attraction(**item))
        except Exception:
            pass

    if final_attractions:
        await set_cached(key, [a.to_dict() for a in final_attractions])
        
    return final_attractions


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
