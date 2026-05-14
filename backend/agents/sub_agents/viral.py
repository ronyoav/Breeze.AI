import json
from datetime import datetime
from utils.api_clients import tavily_search
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object

VIRAL_INSTRUCTIONS = """
=== VIRAL SPOTS AGENT SPECIFIC BEHAVIOR ===
You are evaluating trendy, Instagrammable, and viral TikTok spots.
- AGE DEMOGRAPHICS: If the group is older adults (e.g., 60+), they likely do not care about TikTok dance spots or trendy neon cafes. Instead, suggest "hidden gems" or classic photogenic spots. If they are young adults (18-30), heavily prioritize highly aesthetic, viral, aesthetic cafes, or trendy pop-ups.
- SCORING: Calculate the `subAgentScore` based entirely on how visually appealing or "cool" the spot is for the specific group.
"""

@traceable(name="Viral Spots Agent", tags=["subagent", "viral"])
async def fetch_viral(user_profile: dict) -> list[Attraction]:
    location = user_profile.get("location", {})
    city = location.get("city", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"viral_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    year = datetime.now().year
    data = await tavily_search(
        f"viral Instagram spots hidden gems must-see {city} {year}", 10
    )
    
    raw_results = data.get("results", [])
    if not raw_results:
        return []

    system_prompt = build_subagent_prompt(user_profile, "viral", VIRAL_INSTRUCTIONS)
    
    raw_content = json.dumps(raw_results, indent=2)
    response = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Raw search results for viral spots in {city}:\n{raw_content}"}],
    )

    text = response.content[0].text if response.content else "{}"
    json_match = extract_json_object(text)

    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "viral"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
