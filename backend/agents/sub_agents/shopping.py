import json
import httpx
from langsmith import traceable
from utils.api_clients import OVERPASS_BASE
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from typing import Optional
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object

SHOPPING_INSTRUCTIONS = """
=== SHOPPING AGENT SPECIFIC BEHAVIOR ===
You are evaluating retail and shopping locations. Your scoring must be ruthlessly strict based on the user's demographic and budget:
- LUXURY VS THRIFT: If the budget is 3, aggressively score high-end boutiques (Cartier, Rolex, designer fashion) closer to 10.0. Reject cheap malls. If the budget is 1, aggressively reject luxury brands and score vintage, thrift, or standard malls highly.
- AGE DEMOGRAPHICS: If the group is "friends" and ages are 18-25, prioritize trendy streetwear, sneaker boutiques, and viral pop-ups. If the group is "family" with children, prioritize large department stores or malls with diverse offerings.
- MEN VS WOMEN: Analyze the genders in `groupStructure`. Do not suggest a high-end women's cosmetics flagship if the group consists entirely of 21-year-old men.
- PRICING FORMAT: In your output, the `prices` field MUST be accurately mapped: 1 for cheap/standard, 2 for mid-tier, 3 for luxury.
"""

@traceable(name="Shopping Subagent", tags=["subagent", "shopping"])
async def fetch_shopping(user_profile: dict) -> list[Attraction]:
    """
    Shopping Sub-Agent
    
    Role: Identifies retail districts, malls, thrift stores, and luxury boutiques.
    
    Behavior:
    1. Maps the numerical budget tier from the `user_profile` to specific shopping targets.
    2. Uses Tavily to query targeted shopping areas within the requested city.
    3. Sends raw search data to Claude for profile-based curation.
    4. Strictly avoids luxury brands for low budgets (preferring thrift/vintage) and prioritizes high-end districts for luxury budgets.
    5. Returns a structured JSON array of shopping Attraction objects.
    """
    # 1. Extract variables from the dictionary
    location = user_profile.get("location", {})
    city = location.get("city", "")
    budget_num = user_profile.get("budget", 2)
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"shopping_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    # Map the numerical budget back to the shop_types we need
    shop_types = "boutique|jewelry|watches" if budget_num == 3 else "mall|department_store|clothes"
    
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

    raw_attractions = []
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
        
        raw_attractions.append({
            "id": str(el.get('id', id(el))),
            "name": name,
            "address": address,
            "coordinates": {"lat": lat, "lng": lon} if lat and lon else None,
            "shop_type": tags.get('shop')
        })

    if not raw_attractions:
        return []

    # 2. Build the dynamic prompt using the Injector
    system_prompt = build_subagent_prompt(user_profile, "shopping", SHOPPING_INSTRUCTIONS)
    
    # 3. Call Claude to score, filter, and format the JSON
    raw_json_str = json.dumps(raw_attractions, indent=2)
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Raw shopping spots:\n{raw_json_str}"}]
    )

    text = message.content[0].text if message.content else "{}"
    json_match = extract_json_object(text)
    
    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "shopping"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
