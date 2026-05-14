import json
from utils.agent_loop import run_agent_loop
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable
from utils.llm import build_subagent_prompt, extract_json_object

BUDGET_LABEL = {
    "budget": "affordable budget-friendly",
    "comfort": "mid-range popular",
    "luxury": "luxury high-end",
}

SPA_INSTRUCTIONS = """
=== SPA AGENT SPECIFIC BEHAVIOR ===
You are evaluating spa centers, wellness retreats, and massage studios.
- BUDGET MATCHING: The user's budget is mapped to a price tier. If budget is 1, search for local, highly-rated affordable massage parlors or day spas. If budget is 3, search for luxury resort spas or high-end wellness retreats.
- DEMOGRAPHICS: Read the `groupStructure`. If the group includes children, avoid adult-only retreats and suggest family-friendly wellness centers (like thermal baths). If it's a couple, suggest romantic couples massage spots.
- ENRICHMENT: The `description` field MUST clearly state the signature treatments and atmosphere.
"""

@traceable(name="Spa Agent", tags=["subagent", "wellness"])
async def fetch_spa(user_profile: dict) -> list[Attraction]:
    """
    Spa & Wellness Sub-Agent
    
    Role: Identifies the best spa centers, wellness retreats, and massage studios.
    
    Behavior:
    1. Extracts the budget and demographics from the `user_profile`.
    2. Uses the autonomous agent loop to search the web for wellness options.
    3. Filters based on budget (local massage parlors vs. luxury resort spas).
    4. Adapts to the group (suggesting family-friendly baths or romantic couples massages).
    5. Returns a structured JSON array of curated spa Attraction objects.
    """
    location = user_profile.get("location", {})
    city = location.get("city", "")
    budget_num = user_profile.get("budget", 2)
    session_id = user_profile.get("session_id", "default")
    dates = user_profile.get("dates", {})
    start_date = dates.get("start", "")
    end_date = dates.get("end", "")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"spa_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    budget_str = {1: "budget", 2: "comfort", 3: "luxury"}.get(budget_num, "comfort")
    budget_words = BUDGET_LABEL.get(budget_str, BUDGET_LABEL["comfort"])
    
    user_message = (
        f"Search the web to find the best {budget_words} spa and wellness centers in {city} "
        f"for a traveler visiting from {start_date} to {end_date}. "
        f"Include seasonal availability or booking notes where relevant."
    )

    system_prompt = build_subagent_prompt(user_profile, "spa", SPA_INSTRUCTIONS)

    text = await run_agent_loop(system_prompt, user_message)
    json_match = extract_json_object(text)
    
    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "spa"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
