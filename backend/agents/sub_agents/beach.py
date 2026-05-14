import os
import json
import httpx
from langsmith import traceable
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key

BEACH_INSTRUCTIONS = """
=== BEACH AGENT SPECIFIC BEHAVIOR ===
You are evaluating beaches and coastal spots.
- DEMOGRAPHICS: If `groupStructure` includes kids, prioritize safe, family-friendly beaches with shallow water and facilities. If it's a group of young adults, prioritize party beaches or famous surf spots.
- AMENITIES: Always mention in the `notes` field whether there are bathrooms, food options, or umbrella rentals.
- ACCESSIBILITY: If the user needs accessibility, avoid beaches that require hiking down a cliff and prioritize ones with boardwalks or paved access.
"""

async def run_tavily_search(query: str) -> str:
    """Helper function to actually execute the Tavily search via API."""
    api_key = os.getenv("API_KEY_TAVILY")
    if not api_key:
        return json.dumps({"error": "Tavily API key not found in environment."})
        
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "search_depth": "basic",
                "include_answer": True,
                "max_results": 5
            }
        )
        res.raise_for_status()
        data = res.json()
        
        return json.dumps({
            "answer": data.get("answer"),
            "results": [{"title": r.get("title"), "content": r.get("content")} for r in data.get("results", [])]
        })

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

    tavily_tool = {
        "name": "search_tavily",
        "description": "Searches the web for recent information and recommendations using the Tavily search engine.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The precise search query, e.g. 'best beaches near Tel Aviv'"}
            },
            "required": ["query"]
        }
    }

    system_prompt = build_subagent_prompt(user_profile, "beach", BEACH_INSTRUCTIONS)
    
    messages = [{"role": "user", "content": f"Use search_tavily to find the best beaches near: {city}. Then score them and return the strict JSON schema."}]

    response = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        temperature=0.3,
        system=system_prompt,
        messages=messages,
        tools=[tavily_tool]
    )

    if response.stop_reason == "tool_use":
        tool_call = next(b for b in response.content if b.type == "tool_use")
        if tool_call.name == "search_tavily":
            search_results = await run_tavily_search(tool_call.input["query"])
            
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_call.id,
                        "content": search_results
                    }
                ]
            })

            response = await async_client.messages.create(
                model=MODEL_HAIKU,
                max_tokens=4000,
                temperature=0.3,
                system=system_prompt,
                messages=messages,
                tools=[tavily_tool]
            )

    final_text = next(b.text for b in response.content if b.type == "text")
    json_match = extract_json_object(final_text)

    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "beach"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
