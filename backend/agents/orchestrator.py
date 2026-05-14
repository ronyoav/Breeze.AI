import json
import anthropic

from agents.attraction_manager import run_attraction_manager
from agents.scheduler import run_scheduler
from prompts.orchestrator_prompt import build_orchestrator_prompt, build_feedback_prompt

client = anthropic.Anthropic()


async def generate_itinerary(
    city: str,
    departure: str,
    start_date: str,
    end_date: str,
    days: int,
    composition: str,
    budget: str,
    interests: list[str],
) -> dict:
    # Step 1: fetch attractions (async, parallel sub-agents)
    pool = await run_attraction_manager(
        city=city,
        budget=budget,
        composition=composition,
        interests=interests,
        start_date=start_date,
        end_date=end_date,
        days=days,
    )

    # Step 2: schedule into days (sync Haiku call)
    schedule = run_scheduler(
        city=city,
        days=days,
        start_date=start_date,
        attraction_pool=pool,
    )

    # Build lookup map
    pool_map = {a.id: a.to_dict() for a in pool}
    scheduled = [
        {**day, "attractions": [pool_map[i] for i in day.get("attraction_ids", []) if i in pool_map]}
        for day in schedule
    ]

    # Step 3: Orchestrator builds final narrative (Sonnet)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": (
                build_orchestrator_prompt(
                    city=city,
                    days=days,
                    departure=departure,
                    composition=composition,
                    budget=budget,
                    interests=interests,
                )
                + f"\n\nScheduled attractions by day:\n{json.dumps(scheduled, indent=2)}"
            ),
        }],
    )

    text = message.content[0].text if message.content else "{}"
    match = _extract_json_object(text)
    return json.loads(match) if match else {"days": []}


def refine_feedback(feedback: str, current_itinerary: dict) -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": build_feedback_prompt(feedback, current_itinerary),
        }],
    )

    text = message.content[0].text if message.content else "{}"
    match = _extract_json_object(text)
    return json.loads(match) if match else current_itinerary


def _extract_json_object(text: str) -> str | None:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None
