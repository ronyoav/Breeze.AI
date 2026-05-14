import asyncio
import json
import httpx
from utils.api_clients import TICKETMASTER_BASE, EVENTBRITE_BASE, ticketmaster_key, eventbrite_key
from utils.llm import async_client, MODEL_HAIKU
from utils.parsers import Attraction
from cache.redis import get_cached, set_cached, attraction_cache_key
from langsmith import traceable

SYSTEM_PROMPT = """You are the Events Agent for Breeze.AI, a travel planning assistant.
Your specialty is curating the most exciting and relevant events for travelers:
concerts, festivals, sports games, cultural shows, and local happenings.

You will receive a list of raw events fetched from ticketing platforms.
Your job is to select the most interesting ones, enrich their descriptions,
and return them as a clean JSON array. Output ONLY a valid JSON array — no extra text:
[
  {
    "id": "event-1",
    "name": "Event Name",
    "category": "events",
    "description": "2-3 engaging sentences about what the event is and why it's worth attending",
    "address": "venue name and/or address",
    "url": "ticket or event url",
    "tip": "booking advice, price range, or what to expect"
  }
]
Keep the 8-12 most compelling events. If the raw list is short, keep all of them."""


@traceable(name="Events Agent", tags=["subagent", "events"])
async def fetch_events(city: str, start_date: str, end_date: str) -> list[Attraction]:
    key = attraction_cache_key(city, "events")
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

    raw_text = json.dumps([a.to_dict() for a in raw], indent=2)
    message = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": (
                f"Here are events in {city} from {start_date} to {end_date}. "
                f"Curate and enrich them:\n\n{raw_text}"
            ),
        }],
    )

    text = message.content[0].text if message.content else "[]"
    start, end = text.find("["), text.rfind("]")
    attractions: list[Attraction] = []
    if start != -1 and end != -1:
        try:
            attractions = [Attraction(**a) for a in json.loads(text[start:end + 1])]
        except Exception:
            attractions = raw

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
