import os
import json
import httpx
from langsmith import traceable
from utils.llm import async_client, MODEL_HAIKU
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key

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
        
        # Return a summarized version to save tokens
        return json.dumps({
            "answer": data.get("answer"),
            "results": [{"title": r.get("title"), "content": r.get("content")} for r in data.get("results", [])]
        })

@traceable(name="Beach Subagent", tags=["subagent", "tavily", "tool_use"])
async def fetch_beach(city: str) -> list[Attraction]:
    # Use a new cache key since the logic changed entirely
    key = attraction_cache_key(city, "beach_ai_tavily")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    # Step 1: Define the Tavily Tool for Anthropic
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

    system_prompt = (
        "You are the Beach Subagent. Your goal is to find the best beaches near the user's city.\n"
        "1. Use the `search_tavily` tool to search the web for the best beaches in the given city.\n"
        "2. Read the search results and select the best, most highly-recommended beaches.\n"
        "3. Output a final response as a JSON array of objects. Each object must exactly match this format:\n"
        "   {\n"
        "     \"id\": \"unique_string_id\",\n"
        "     \"name\": \"Name of the Beach\",\n"
        "     \"category\": \"beach\",\n"
        "     \"description\": \"A highly contextual 1-sentence description based on the search results\",\n"
        "     \"address\": \"Approximate location or city\"\n"
        "   }\n"
        "Do not include any conversational filler. Return ONLY the raw JSON array."
    )

    messages = [{"role": "user", "content": f"Find the best beaches near: {city}"}]

    # Step 2: Call the LLM with the tool available
    response = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=2048,
        temperature=0.3,
        system=system_prompt,
        messages=messages,
        tools=[tavily_tool]
    )

    # Step 3: Check if the LLM decided to use the tool
    if response.stop_reason == "tool_use":
        # Find the tool use block
        tool_call = next(b for b in response.content if b.type == "tool_use")
        
        if tool_call.name == "search_tavily":
            print(f"[Beach Subagent] Executing Tavily Search for: {tool_call.input['query']}")
            search_results = await run_tavily_search(tool_call.input["query"])
            
            # We must append the LLM's previous response to the conversation history
            messages.append({"role": "assistant", "content": response.content})
            
            # Then we append the tool's result as a user message
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

            # Step 4: Call the LLM again with the new context so it can generate the JSON
            response = await async_client.messages.create(
                model=MODEL_HAIKU,
                max_tokens=2048,
                temperature=0.3,
                system=system_prompt,
                messages=messages,
                tools=[tavily_tool]
            )

    # Step 5: Extract the final text and parse it into Attraction objects
    final_text = next(b.text for b in response.content if b.type == "text")
    
    # Strip markdown formatting if the LLM added it
    if "```json" in final_text:
        final_text = final_text.split("```json")[1].split("```")[0].strip()
    elif "```" in final_text:
        final_text = final_text.split("```")[1].split("```")[0].strip()

    try:
        data = json.loads(final_text)
        # Convert JSON objects to Attraction python objects
        attractions = [Attraction(**{**item, "category": "beach"}) for item in data[:12]]
    except Exception as e:
        print(f"[Beach Subagent] Error parsing JSON: {e}")
        attractions = []

    # Cache successful results
    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions
