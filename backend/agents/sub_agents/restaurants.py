import json
from utils.agent_loop import run_agent_loop
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable
from utils.llm import build_subagent_prompt, extract_json_object

BUDGET_LABEL = {
    "budget": "cheap affordable local street food and budget-friendly",
    "comfort": "mid-range popular local",
    "luxury": "upscale fine dining gourmet",
}

RESTAURANTS_INSTRUCTIONS = """
=== RESTAURANTS AGENT SPECIFIC BEHAVIOR ===
You are evaluating dining experiences ranging from street food to fine dining.
- BUDGET MATCHING: The user's budget is mapped to a price tier. If budget is 1, aggressively search for and score highly cheap street food, local markets, and affordable hidden gems. If budget is 3, search for Michelin-starred restaurants, fine dining, or exclusive upscale spots.
- DIETARY/ACCESSIBILITY: Read the `user_profile` carefully. If there are specific interests like "vegan" or "seafood", ensure the restaurants align. If accessibility is required, ensure the spot is wheelchair friendly.
- ENRICHMENT: The `description` field MUST clearly state WHAT the cuisine is and WHY this specific group should go. Do not just say "It is a restaurant."
"""

@traceable(name="Restaurants Agent", tags=["subagent", "food"])
async def fetch_restaurants(user_profile: dict) -> list[Attraction]:
    location = user_profile.get("location", {})
    city = location.get("city", "")
    budget_num = user_profile.get("budget", 2)
    session_id = user_profile.get("session_id", "default")
    days = user_profile.get("daysNumber", 3)
    
    if not city:
        return []

    key = attraction_cache_key(city, f"restaurants_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    budget_str = {1: "budget", 2: "comfort", 3: "luxury"}.get(budget_num, "comfort")
    budget_words = BUDGET_LABEL.get(budget_str, BUDGET_LABEL["comfort"])
    price_label = {"budget": "$ (budget)", "comfort": "$$ (mid-range)", "luxury": "$$$ (upscale)"}.get(budget_str, "$$")

    user_message = (
        f"Search the web to find the best {budget_words} restaurants in {city} for a {days}-day trip. "
        f"The traveler has a {price_label} budget. Include must-try local spots."
    )
    
    system_prompt = build_subagent_prompt(user_profile, "restaurants", RESTAURANTS_INSTRUCTIONS)

    text = await run_agent_loop(system_prompt, user_message)
    json_match = extract_json_object(text)
    
    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "restaurants"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
