import os
import json
import httpx
from langsmith import traceable
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object
from utils.parsers import Attraction, make_attraction_id
from cache.redis import get_cached, set_cached, attraction_cache_key

BEACH_INSTRUCTIONS = """
=== BEACH AGENT SPECIFIC BEHAVIOR ===
You are evaluating beaches and coastal spots.
- DEMOGRAPHICS: If `groupStructure` includes kids, prioritize safe, family-friendly beaches with shallow water and facilities. If it's a group of young adults, prioritize party beaches or famous surf spots.
- AMENITIES: Always mention in the `notes` field whether there are bathrooms, food options, or umbrella rentals.
- ACCESSIBILITY: If the user needs accessibility, avoid beaches that require hiking down a cliff and prioritize ones with boardwalks or paved access.
- IMAGES: You MUST use the `duckduckgo_image` tool to find a relevant image URL for each recommended place and include it in the `imageurl` field.
"""

@traceable(name="Beach Subagent", tags=["subagent", "tavily", "tool_use", "beach"])
async def fetch_beach(user_profile: dict) -> list[Attraction]:
    """
    Beach Sub-Agent
    
    Role: Discovers and curates top-rated beaches and coastal spots.
    
    Behavior:
    1. Ingests the `user_profile` to understand the group's demographics (e.g., family vs. young adults).
    2. Utilizes Anthropic's tool-use feature to let Claude autonomously search Tavily for beaches near the destination.
    3. Filters search results to prioritize safety and amenities for families, or vibrant/party atmospheres for young adults.
    4. Evaluates accessibility needs, preferring boardwalks if required.
    5. Returns a structured JSON array containing the selected beaches formatted as Attraction objects.
    """
    location = user_profile.get("location", {})
    city = location.get("city", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"beach_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    system_prompt = build_subagent_prompt(user_profile, "beach", BEACH_INSTRUCTIONS)
    
    user_message = f"Use search_web to find the best beaches near: {city}. Then score them and return the strict JSON schema."

    from utils.agent_loop import run_agent_loop
    from utils.tools import SEARCH_TOOL, DUCKDUCKGO_IMAGE_TOOL
    
    final_text = await run_agent_loop(system_prompt, user_message, tools=[SEARCH_TOOL, DUCKDUCKGO_IMAGE_TOOL])
    json_match = extract_json_object(final_text)

    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "beach"
                if "id" not in item or item.get("id") == "generated_id":
                    item["id"] = make_attraction_id(city, item.get("name", ""))
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
