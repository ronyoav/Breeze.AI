import json
from utils.api_clients import tavily_search
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object

EXTREME_INSTRUCTIONS = """
=== EXTREME SPORTS AGENT SPECIFIC BEHAVIOR ===
You are evaluating extreme sports and high-adrenaline adventure activities.
- AGE DEMOGRAPHICS: Read the `groupStructure` carefully. If there are older adults (e.g., 60+) or very young children, DO NOT suggest dangerous or highly intense activities like skydiving or bungee jumping. Instead, suggest milder "adventure" activities like zip-lining or scenic helicopter tours. If they are young adults, go for maximum adrenaline.
- BUDGET: Extreme sports are expensive. If the budget is 1, prioritize hiking, outdoor rock climbing, or local skate parks. If 3, suggest luxury adventures like private skydiving or chartered boat tours.
- SAFETY & WEATHER: Always include safety requirements or weather dependency in the `notes`.
"""

@traceable(name="Extreme Sports Agent", tags=["subagent", "extreme"])
async def fetch_extreme(user_profile: dict) -> list[Attraction]:
    location = user_profile.get("location", {})
    city = location.get("city", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"extreme_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    data = await tavily_search(
        f"extreme sports adventure activities near {city} skydiving bungee surfing paragliding", 10
    )
    
    raw_results = data.get("results", [])
    if not raw_results:
        return []

    system_prompt = build_subagent_prompt(user_profile, "extreme", EXTREME_INSTRUCTIONS)
    
    raw_content = json.dumps(raw_results, indent=2)
    response = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Raw search results for extreme sports in {city}:\n{raw_content}"}],
    )

    text = response.content[0].text if response.content else "{}"
    json_match = extract_json_object(text)

    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "extreme"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
