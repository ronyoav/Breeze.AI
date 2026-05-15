import json
from utils.agent_loop import run_agent_loop
from utils.parsers import Attraction, make_attraction_id
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
- IMAGES: You MUST use the `duckduckgo_image` tool to find a relevant image URL for each recommended place and include it in the `imageurl` field.
"""

@traceable(name="Restaurants Agent", tags=["subagent", "food"])
async def fetch_restaurants(user_profile: dict) -> list[Attraction]:
    """
    Restaurants & Food Sub-Agent
    
    Role: Discovers the best dining experiences matching a traveler's budget and taste.
    
    Behavior:
    1. Maps the numerical budget tier (1, 2, or 3) from the `user_profile` to a targeted search term (e.g., street food vs. fine dining).
    2. Utilizes the autonomous agent loop to search the web for current, highly-rated restaurants.
    3. Strictly enforces dietary restrictions or accessibility needs found in the user's profile.
    4. Enriches the description with clear details on cuisine type and why it suits the group.
    5. Returns a structured JSON array of curated dining Attraction objects.
    """
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
    
    from utils.tools import SEARCH_TOOL, DUCKDUCKGO_IMAGE_TOOL
    system_prompt = build_subagent_prompt(user_profile, "restaurants", RESTAURANTS_INSTRUCTIONS)

    text = await run_agent_loop(system_prompt, user_message, tools=[SEARCH_TOOL, DUCKDUCKGO_IMAGE_TOOL])
    json_match = extract_json_object(text)
    
    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "restaurants"
                if "id" not in item or item.get("id") == "generated_id":
                    item["id"] = make_attraction_id(city, item.get("name", ""))
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
