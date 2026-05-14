import asyncio
import json
import httpx
from utils.api_clients import TICKETMASTER_BASE, EVENTBRITE_BASE, ticketmaster_key, eventbrite_key
from utils.llm import async_client, MODEL_HAIKU, build_subagent_prompt, extract_json_object
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

EVENTS_INSTRUCTIONS = """
=== EVENTS AGENT SPECIFIC BEHAVIOR ===
You are evaluating dynamic events like concerts, festivals, sports games, and cultural shows.
- DATE STRICTNESS: Ensure the events you select actually make sense for a travel itinerary. 
- BUDGET & PRICING: If the budget is 1, prioritize free street festivals, local community events, or cheap indie shows. If the budget is 3, prioritize VIP experiences, front-row concert tickets, or high-end theater.
- GROUP MATCHING: If the group is "family" with kids under 12, aggressively reject late-night club events or mature comedy shows. Suggest family-friendly theater or sports.
- ENRICHMENT: The `description` field MUST clearly state WHAT the event is and WHY this specific group should go. Do not just copy the raw API description.
"""

@traceable(name="Events Agent", tags=["subagent", "events"])
async def fetch_events(user_profile: dict) -> list[Attraction]:
    """
    Events Sub-Agent
    
    Role: Sources live events, concerts, festivals, and performances occurring during the user's trip.
    
    Behavior:
    1. Extracts the exact travel dates and location from the `user_profile`.
    2. Queries the Ticketmaster API to retrieve real, scheduled events.
    3. Triggers a fallback Tavily web search if Ticketmaster yields insufficient results.
    4. Passes the raw event data to Claude for curation.
    5. Claude filters events based on the group's age demographics and budget (e.g., VIP vs standard admission).
    6. Returns a structured JSON array of enriched Attraction objects.
    """
    location = user_profile.get("location", {})
    city = location.get("city", "")
    dates = user_profile.get("dates", {})
    start_date = dates.get("start", "")
    end_date = dates.get("end", "")
    session_id = user_profile.get("session_id", "default")
    
    if not city or not start_date or not end_date:
        return []

    key = attraction_cache_key(city, f"events_{session_id}")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    tm_task = _fetch_ticketmaster(city, start_date, end_date)
    eb_task = _fetch_eventbrite(city, start_date, end_date)
    results = await asyncio.gather(tm_task, eb_task, return_exceptions=True)

    raw: list[Attraction] = []
    for r in results:
        if not isinstance(r, Exception):
            raw.extend(r)

    if not raw:
        return []

    system_prompt = build_subagent_prompt(user_profile, "events", EVENTS_INSTRUCTIONS)
    
    raw_text = json.dumps([a.to_dict() for a in raw], indent=2)
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=2048,
        system=system_prompt,
        messages=[{
            "role": "user",
            "content": (
                f"Here are events in {city} from {start_date} to {end_date}. "
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
                item["category"] = "events"
                if "id" not in item:
                    item["id"] = "generated_id"
                attractions.append(Attraction(**item))
        except Exception:
            pass

    if attractions:
        await set_cached(key, [a.to_dict() for a in attractions])
        
    return attractions


async def _fetch_ticketmaster(city: str, start_date: str, end_date: str) -> list[Attraction]:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{TICKETMASTER_BASE}/events.json",
            params={
                "apikey": ticketmaster_key(),
                "city": city,
                "startDateTime": f"{start_date}T00:00:00Z",
                "endDateTime": f"{end_date}T23:59:59Z",
                "size": "10",
                "classificationName": "music",
            },
        )
        res.raise_for_status()
        data = res.json()

    events = data.get("_embedded", {}).get("events", [])
    return [
        Attraction(
            id=f"tm-{e.get('id', i)}",
            name=e.get("name", ""),
            category="events",
            description=str(e.get("info", e.get("pleaseNote", "")))[:200],
            url=e.get("url", ""),
            address=str((e.get("_embedded", {}).get("venues") or [{}])[0].get("name", "")),
        )
        for i, e in enumerate(events)
    ]


async def _fetch_eventbrite(city: str, start_date: str, end_date: str) -> list[Attraction]:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{EVENTBRITE_BASE}/events/search/",
            params={
                "location.address": city,
                "start_date.range_start": f"{start_date}T00:00:00Z",
                "start_date.range_end": f"{end_date}T23:59:59Z",
                "categories": "103",
                "expand": "venue",
            },
            headers={"Authorization": f"Bearer {eventbrite_key()}"},
        )
        res.raise_for_status()
        data = res.json()

    return [
        Attraction(
            id=f"eb-{e.get('id', i)}",
            name=e.get("name", {}).get("text", ""),
            category="events",
            description=str(e.get("description", {}).get("text", ""))[:200],
            url=e.get("url", ""),
            address=str(e.get("venue", {}).get("address", {}).get("localized_address_display", "")),
        )
        for i, e in enumerate(data.get("events", [])[:8])
    ]
