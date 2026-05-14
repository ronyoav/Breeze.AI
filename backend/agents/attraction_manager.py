import asyncio
import json
import anthropic

from utils.parsers import Attraction
from prompts.attraction_prompt import build_attraction_prompt

from agents.sub_agents.restaurants import fetch_restaurants
from agents.sub_agents.nightlife import fetch_nightlife
from agents.sub_agents.history import fetch_history
from agents.sub_agents.sports import fetch_sports
from agents.sub_agents.extreme import fetch_extreme
from agents.sub_agents.treks import fetch_treks
from agents.sub_agents.beach import fetch_beach
from agents.sub_agents.spa import fetch_spa
from agents.sub_agents.events import fetch_events
from agents.sub_agents.shopping import fetch_shopping
from agents.sub_agents.viral import fetch_viral

client = anthropic.Anthropic()


async def run_attraction_manager(
    city: str,
    budget: str,
    composition: str,
    interests: list[str],
    start_date: str,
    end_date: str,
    days: int,
) -> list[Attraction]:
    fetcher_map = {
        "restaurants": lambda: fetch_restaurants(city, budget, days),
        "nightlife":   lambda: fetch_nightlife(city, budget),
        "history":     lambda: fetch_history(city),
        "sports":      lambda: fetch_sports(city),
        "extreme":     lambda: fetch_extreme(city),
        "treks":       lambda: fetch_treks(city),
        "beach":       lambda: fetch_beach(city),
        "spa":         lambda: fetch_spa(city, budget),
        "events":      lambda: fetch_events(city, start_date, end_date),
        "shopping":    lambda: fetch_shopping(city, budget),
        "viral":       lambda: fetch_viral(city),
    }

    active = [i for i in interests if i in fetcher_map]
    results = await asyncio.gather(*[fetcher_map[i]() for i in active], return_exceptions=True)

    raw: list[Attraction] = []
    for r in results:
        if not isinstance(r, Exception):
            raw.extend(r)

    if not raw:
        return []

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": build_attraction_prompt(
                city=city,
                category=", ".join(interests),
                budget=budget,
                composition=composition,
                raw_data=[a.to_dict() for a in raw],
            ),
        }],
    )

    text = message.content[0].text if message.content else "[]"
    match = _extract_json_array(text)
    if match:
        return [Attraction(**a) for a in json.loads(match)]
    return raw


from typing import Optional

def _extract_json_array(text: str) -> Optional[str]:
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None
