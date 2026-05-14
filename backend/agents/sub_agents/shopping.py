import json
import httpx
from anthropic import AsyncAnthropic
from langsmith import traceable
from utils.api_clients import OVERPASS_BASE
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from typing import Optional
from utils.llm import async_client, MODEL_HAIKU

def build_shopping_prompt(user_profile: dict) -> str:
    profile_json = json.dumps(user_profile, indent=2)
    return f"""You are an expert personal shopping curator.
You are curating a highly personalized list of shopping spots specifically for this user profile:
<user_profile>
{profile_json}
</user_profile>

You will receive a raw list of shopping spots fetched from OpenStreetMap.
Your job is to select the 5-8 most compelling shopping spots that perfectly match the user's budget, ages, group relation, and interests.

CRITICAL INSTRUCTIONS:
1. You must calculate a `subAgentScore` (from 1.0 to 10.0) for each spot based ONLY on how well it fits the <user_profile>.
2. Fill out all required fields (`ageRange`, `reviews`, `prices`, `notes`, `specialNotes`, etc.). If you don't know a field, use null.
3. Output ONLY a valid JSON array — no extra text, markdown, or explanations. Do NOT wrap it in a JSON block. Just the raw array starting with [ and ending with ].

Example JSON Array Format:
[
  {{
    "name": "Boutique Name",
    "address": "Street Address",
    "coordinates": {{"lat": 48.0, "lng": 2.0}},
    "description": "2-3 sentences about why they will love it.",
    "imageurl": null,
    "ageRange": "Adults",
    "reviews": 4.8,
    "prices": 3,
    "notes": "Appointment only.",
    "specialNotes": "Flagship store.",
    "subAgentScore": 9.5,
    "scoresLog": [9.5]
  }}
]"""

def _extract_json_array(text: str) -> Optional[str]:
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None

@traceable(name="Shopping Subagent", tags=["subagent", "shopping"])
async def fetch_shopping(user_profile: dict) -> list[Attraction]:
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

    # 2. Build the dynamic prompt
    system_prompt = build_shopping_prompt(user_profile)
    
    # 3. Call Claude to score, filter, and format the JSON
    raw_json_str = json.dumps(raw_attractions, indent=2)
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Raw shopping spots:\n{raw_json_str}"}]
    )

    text = message.content[0].text if message.content else "[]"
    json_match = _extract_json_array(text)
    
    attractions = []
    if json_match:
        try:
            parsed_list = json.loads(json_match)
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
