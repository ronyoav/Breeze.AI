import json
import httpx
from langsmith import traceable
from utils.api_clients import OVERPASS_BASE, tavily_search
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
- IMAGES: You MUST use the `duckduckgo_image` tool to find a relevant image URL for each recommended place and include it in the `imageurl` field.
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

    # 2. Build the dynamic prompt using the Injector
    system_prompt = build_subagent_prompt(user_profile, "shopping", SHOPPING_INSTRUCTIONS)
    
    # Map the numerical budget back to the shop_types we need
    shop_types = "luxury boutiques, designer fashion, jewelry, and high-end watches" if budget_num == 3 else "popular malls, department stores, thrift shops, and trendy clothing stores"

    # 3. Call Tavily agent loop to search the web
    user_message = (
        f"Search the web to find the best {shop_types} in {city}. "
        f"Make sure they are actual locations in {city}."
    )
    
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
                item["category"] = "shopping"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if not attractions:
        attractions = await _tavily_fallback(city, budget_num)

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])

    return attractions


async def _tavily_fallback(city: str, budget_num: int) -> list[Attraction]:
    query = f"luxury boutiques jewelry shopping {city}" if budget_num == 3 else f"best shopping malls markets {city}"
    try:
        result = await tavily_search(query, 6)
    except Exception:
        return []
    attractions = []
    for i, r in enumerate(result.get("results", [])):
        attractions.append(Attraction(
            id=f"tavily-shopping-{i}",
            name=r.get("title", "").split(" - ")[0].strip(),
            category="shopping",
            description=str(r.get("content", r.get("snippet", "")))[:200],
            url=r.get("url", ""),
        ))
    return attractions
