import asyncio
import json
from utils.api_clients import tavily_search
from utils.parsers import Attraction
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

_QUERIES = [
    ("bars", "best local bars hidden gems {city}"),
    ("clubs", "best nightclubs dance clubs {city}"),
    ("live", "live music jazz rooftop bar {city}"),
]

NIGHTLIFE_INSTRUCTIONS = """
=== NIGHTLIFE AGENT SPECIFIC BEHAVIOR ===
You are evaluating bars, clubs, lounges, and live music venues.
- AGE DEMOGRAPHICS: Read the `groupStructure`. If the group contains people under 21 (especially in the US), aggressively reject 21+ clubs and bars. Suggest all-ages live music, evening cafes, or family-friendly evening entertainment. If they are 21-25, prioritize high-energy clubs or trendy bars.
- GROUP MATCHING: If the group relation is "family", avoid wild nightclubs and suggest relaxed lounges or jazz clubs.
- ENRICHMENT: The `description` field MUST clearly capture the vibe. Tell them exactly what to expect regarding music, crowd, and atmosphere.
- IMAGES: You MUST use the `duckduckgo_image` tool to find a relevant image URL for each recommended place and include it in the `imageurl` field.
"""

@traceable(name="Nightlife Agent", tags=["subagent", "nightlife"])
async def fetch_nightlife(user_profile: dict) -> list[Attraction]:
    """
    Nightlife Sub-Agent
    
    Role: Evaluates bars, clubs, lounges, and live music venues.
    
    Behavior:
    1. Extracts the city and group structure from the `user_profile`.
    2. Runs parallel Tavily searches for various nightlife categories (bars, clubs, live music).
    3. Consolidates the web results and passes them to Claude for curation.
    4. Aggressively filters based on age demographics, avoiding 21+ clubs if the group contains underage travelers, and preferring relaxed lounges for family groups.
    5. Returns a structured JSON array of curated Nightlife Attraction objects.
    """
    location = user_profile.get("location", {})
    city = location.get("city", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"nightlife_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    tasks = [tavily_search(q.format(city=city), 4) for _, q in _QUERIES]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    combined_content = []
    for (label, _), result in zip(_QUERIES, raw_results):
        if isinstance(result, Exception):
            continue
        for r in result.get("results", []):
            combined_content.append(
                f"[{label}] {r.get('title', '')}\n{r.get('content', r.get('snippet', ''))[:400]}"
            )

    if not combined_content:
        return []

    system_prompt = build_subagent_prompt(user_profile, "nightlife", NIGHTLIFE_INSTRUCTIONS)
    attractions = await _extract_venues(city, combined_content, system_prompt)
    
    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions


async def _extract_venues(city: str, content_blocks: list[str], system_prompt: str) -> list[Attraction]:
    raw_content = "\n\n---\n\n".join(content_blocks)
    user_message = f"Raw search results for nightlife in {city}:\n{raw_content}"
    
    from utils.agent_loop import run_agent_loop
    from utils.tools import SEARCH_TOOL, DUCKDUCKGO_IMAGE_TOOL
    text = await run_agent_loop(system_prompt, user_message, tools=[SEARCH_TOOL, DUCKDUCKGO_IMAGE_TOOL])
    json_match = extract_json_object(text)

    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "nightlife"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception as e:
            pass

    return attractions
