import json
import httpx
from utils.api_clients import TICKETMASTER_BASE, ticketmaster_key
from utils.agent_loop import run_agent_loop
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

SPORTS_INSTRUCTIONS = """
=== SPORTS AGENT SPECIFIC BEHAVIOR ===
You are evaluating live sports matches, stadium tours, and sporting events.
- BUDGET MATCHING: If the budget is 1, prioritize cheap local games, minor leagues, or free outdoor sports parks. If the budget is 3, suggest VIP seating at major league games, expensive golf courses, or luxury box experiences.
- INTERESTS: If their interests include specific sports, ensure those are prioritized.
- ENRICHMENT: The `description` field MUST clearly state the atmosphere. If it is a live game, specify who is playing.
"""

@traceable(name="Sports Agent", tags=["subagent", "sports"])
async def fetch_sports(user_profile: dict) -> list[Attraction]:
    """
    Sports Sub-Agent
    
    Role: Evaluates live sports matches, stadium tours, and sporting events.
    
    Behavior:
    1. Extracts travel dates and interests from the `user_profile`.
    2. Queries the Ticketmaster API for live sports matches during the trip dates.
    3. Falls back to a generic web search for stadiums and tours if no live events match.
    4. Curates the events with LLM logic to emphasize the atmosphere and VIP vs standard tickets based on budget.
    5. Returns a structured JSON array of sports Attraction objects.
    """
    location = user_profile.get("location", {})
    city = location.get("city", "")
    dates = user_profile.get("dates", {})
    start_date = dates.get("start", "")
    end_date = dates.get("end", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city or not start_date or not end_date:
        return []

    key = attraction_cache_key(city, f"sports_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    # Try Ticketmaster first for real match data
    tm_results = await _fetch_ticketmaster(city, start_date, end_date)

    system_prompt = build_subagent_prompt(user_profile, "sports", SPORTS_INSTRUCTIONS)

    if tm_results:
        attractions = await _curate_with_llm(tm_results, city, start_date, end_date, system_prompt)
    else:
        # Fall back to Tavily agent search
        user_message = (
            f"Search the web to find the best sports activities, stadiums, and live sport events in {city} "
            f"for a traveler visiting from {start_date} to {end_date}. "
            f"Highlight anything happening during that specific period."
        )
        text = await run_agent_loop(system_prompt, user_message)
        json_match = extract_json_object(text)
        attractions = []
        if json_match:
            try:
                parsed_data = json.loads(json_match)
                parsed_list = parsed_data.get("results", [])
                for item in parsed_list:
                    item["category"] = "sports"
                    if "id" not in item:
                        item["id"] = "generated_id"
                    attractions.append(Attraction(**item))
            except Exception:
                pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions


async def _fetch_ticketmaster(city: str, start_date: str, end_date: str) -> list[Attraction]:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(
                f"{TICKETMASTER_BASE}/events.json",
                params={
                    "apikey": ticketmaster_key(),
                    "city": city,
                    "startDateTime": f"{start_date}T00:00:00Z",
                    "endDateTime": f"{end_date}T23:59:59Z",
                    "size": "10",
                    "classificationName": "sports",
                },
            )
            res.raise_for_status()
            data = res.json()
    except Exception:
        return []

    events = data.get("_embedded", {}).get("events", [])
    return [
        Attraction(
            id=f"tm-sports-{e.get('id', i)}",
            name=e.get("name", ""),
            category="sports",
            description=str(e.get("info", e.get("pleaseNote", "")))[:200],
            url=e.get("url", ""),
            address=str((e.get("_embedded", {}).get("venues") or [{}])[0].get("name", "")),
        )
        for i, e in enumerate(events)
    ]


async def _curate_with_llm(
    raw: list[Attraction], city: str, start_date: str, end_date: str, system_prompt: str
) -> list[Attraction]:
    raw_text = json.dumps([a.to_dict() for a in raw], indent=2)
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=4000,
        system=system_prompt,
        messages=[{
            "role": "user",
            "content": (
                f"Here are live sports events in {city} from {start_date} to {end_date}. "
                f"Curate and enrich them based on the profile:\n\n{raw_text}"
            ),
        }],
    )

    text = message.content[0].text if message.content else "{}"
    json_match = extract_json_object(text)
    
    attractions = []
    if json_match:
        try:
            parsed_data = json.loads(json_match)
            parsed_list = parsed_data.get("results", [])
            for item in parsed_list:
                item["category"] = "sports"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass
            
    return attractions or raw
