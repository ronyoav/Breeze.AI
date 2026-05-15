import asyncio
import json
from utils.api_clients import tavily_search
from utils.parsers import Attraction
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

GENERIC_INSTRUCTIONS = """
=== GENERIC AGENT SPECIFIC BEHAVIOR ===
You are a versatile agent handling various requested categories (like theme parks, casinos, museums, etc).
- FLEXIBILITY: Since your category is dynamic, you must strictly evaluate the results against the `user_profile` interests.
- BUDGET: Ensure that your recommendations fit the budget tier.
- SCORING: Calculate the `subAgentScore` based on how well the specific venue aligns with the age demographics and group relation.
- IMAGES: You MUST use the `duckduckgo_image` tool to find a relevant image URL for each recommended place and include it in the `imageurl` field.
"""

@traceable(name="Generic Agent", tags=["subagent", "generic"])
async def fetch_generic(user_profile: dict, category: str) -> list[Attraction]:
    """
    Generic Sub-Agent
    
    Role: Acts as a flexible fallback agent that can search for any arbitrary category
    (e.g., 'casinos', 'theme parks', 'museums') not covered by specialized sub-agents.
    
    Behavior:
    1. Extracts city and session context from the user_profile.
    2. Constructs targeted Tavily queries dynamically based on the requested `category`.
    3. Aggregates search results and forwards them to Claude.
    4. Evaluates the findings strictly against the user's budget and demographic constraints.
    5. Returns a structured JSON array of highly-curated Attraction objects.
    """
    location = user_profile.get("location", {})
    city = location.get("city", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city:
        return []

    key = attraction_cache_key(city, f"generic_{category}_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    queries = [
        f"best {category} in {city}",
        f"{category} {city} recommended places 2025",
    ]
    tasks = [tavily_search(q, 5) for q in queries]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    combined_content = []
    for result in raw_results:
        if isinstance(result, Exception):
            continue
        for r in result.get("results", []):
            combined_content.append(
                f"{r.get('title', '')}\n{r.get('content', r.get('snippet', ''))[:400]}"
            )

    if not combined_content:
        return []

    system_prompt = build_subagent_prompt(user_profile, category, GENERIC_INSTRUCTIONS)
    attractions = await _extract_venues(city, category, combined_content, system_prompt)
    
    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions


async def _extract_venues(city: str, category: str, content_blocks: list[str], system_prompt: str) -> list[Attraction]:
    raw_content = "\n\n---\n\n".join(content_blocks)
    user_message = f"Raw search results for {category} in {city}:\n{raw_content}"
    
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
                item["category"] = category
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    return attractions
