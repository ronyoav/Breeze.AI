import json
from utils.agent_loop import run_agent_loop
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable
from utils.llm import build_subagent_prompt, extract_json_object

TREKS_INSTRUCTIONS = """
=== TREKKING AGENT SPECIFIC BEHAVIOR ===
You are evaluating hiking trails, trekking routes, and outdoor nature tours.
- FITNESS & DEMOGRAPHICS: Read the `groupStructure`. If the group contains elderly people or young children, you MUST prioritize easy, flat, paved, or short nature walks. If the group is young and energetic, prioritize challenging hikes, summits, and intense trekking routes.
- ACCESSIBILITY: If the user requires accessibility, you must only suggest flat, paved trails or accessible boardwalks.
- ENRICHMENT: The `notes` field MUST clearly state the difficulty level and duration of the trek.
"""

@traceable(name="Treks Agent", tags=["subagent", "outdoor"])
async def fetch_treks(user_profile: dict) -> list[Attraction]:
    """
    Treks & Outdoor Sub-Agent
    
    Role: Evaluates hiking trails, trekking routes, and outdoor nature tours.
    
    Behavior:
    1. Extracts city and session context from the `user_profile`.
    2. Searches the web for outdoor trails and nature walks.
    3. Analyzes the `groupStructure` to adjust difficulty (e.g., easy, paved paths for families with children or elderly groups vs. challenging summits for young adults).
    4. Curates the results to highlight trail length and difficulty in the description.
    5. Returns a structured JSON array of trekking Attraction objects.
    """
    location = user_profile.get("location", {})
    city = location.get("city", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"treks_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    user_message = (
        f"Search the web to find the best hiking trails, trekking routes, and guided outdoor tours "
        f"in and around {city}. Include a mix of difficulties."
    )

    system_prompt = build_subagent_prompt(user_profile, "treks", TREKS_INSTRUCTIONS)

    text = await run_agent_loop(system_prompt, user_message)
    json_match = extract_json_object(text)
    
    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "treks"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
