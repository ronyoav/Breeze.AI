import json
import httpx
from utils.api_clients import TICKETMASTER_BASE, ticketmaster_key
from utils.agent_loop import run_agent_loop
from utils.llm import async_client, MODEL_HAIKU
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

SYSTEM_PROMPT = """You are the Sports Agent for Breeze.AI, a travel planning assistant.
Your specialty is finding the best sports experiences for travelers: live matches, stadiums,
sporting venues, outdoor sports activities, and fan experiences.

Use the search_web tool to find real, current options for the city and travel dates provided.
Prioritize events and activities available during the traveler's visit window.
After searching, return ONLY a valid JSON array — no extra text, no markdown:
[
  {
    "id": "sports-1",
    "name": "Activity or Venue Name",
    "category": "sports",
    "description": "2-3 sentences about the experience",
    "address": "neighborhood or venue address",
    "url": "source url if available, else empty string",
    "tip": "tickets, best time to go, booking advice, or seasonal note"
  }
]
Include 6-10 distinct options."""

CURATE_PROMPT = """You are the Sports Agent for Breeze.AI, a travel planning assistant.
You will receive a list of live sports matches and events fetched from Ticketmaster.
Curate and enrich them for a traveler — highlight what makes each worth attending.
Return ONLY a valid JSON array — no extra text, no markdown:
[
  {
    "id": "sports-1",
    "name": "Match or Event Name",
    "category": "sports",
    "description": "2-3 engaging sentences about the event and the atmosphere",
    "address": "venue name and/or address",
    "url": "ticket url",
    "tip": "booking advice, price range, or what to expect as a visitor"
  }
]
Keep all events if 8 or fewer, otherwise pick the 8 most compelling."""


@traceable(name="Sports Agent", tags=["subagent", "sports"])
async def fetch_sports(city: str, start_date: str, end_date: str) -> list[Attraction]:
    key = attraction_cache_key(city, "sports")
    cached = await get_cached(key)
    if cached:
        return [Attraction(**a) for a in cached]

    # Try Ticketmaster first for real match data
    tm_results = await _fetch_ticketmaster(city, start_date, end_date)

    if tm_results:
        attractions = await _curate_with_llm(tm_results, city, start_date, end_date)
    else:
        # Fall back to Tavily agent search
        user_message = (
            f"Find the best sports activities, stadiums, and live sport events in {city} "
            f"for a traveler visiting from {start_date} to {end_date}. "
            f"Highlight anything happening during that specific period."
        )
        text = await run_agent_loop(SYSTEM_PROMPT, user_message)
        start, end = text.find("["), text.rfind("]")
        attractions = []
        if start != -1 and end != -1:
            try:
                attractions = [Attraction(**a) for a in json.loads(text[start:end + 1])]
            except Exception:
                pass

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
    raw: list[Attraction], city: str, start_date: str, end_date: str
) -> list[Attraction]:
    raw_text = json.dumps([a.to_dict() for a in raw], indent=2)
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=2048,
        system=CURATE_PROMPT,
        messages=[{
            "role": "user",
            "content": (
                f"Here are live sports events in {city} from {start_date} to {end_date}. "
                f"Curate and enrich them:\n\n{raw_text}"
            ),
        }],
    )

    text = message.content[0].text if message.content else "[]"
    start, end = text.find("["), text.rfind("]")
    if start != -1 and end != -1:
        try:
            return [Attraction(**a) for a in json.loads(text[start:end + 1])]
        except Exception:
            pass
    return raw
