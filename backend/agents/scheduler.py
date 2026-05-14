import json
import anthropic

from utils.parsers import Attraction
from prompts.scheduler_prompt import build_scheduler_prompt

client = anthropic.Anthropic()


def run_scheduler(
    city: str,
    days: int,
    start_date: str,
    attraction_pool: list[Attraction],
) -> list[dict]:
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": build_scheduler_prompt(
                city=city,
                days=days,
                start_date=start_date,
                attraction_pool=[a.to_dict() for a in attraction_pool],
            ),
        }],
    )

    text = message.content[0].text if message.content else "[]"
    match = _extract_json_array(text)
    return json.loads(match) if match else []


def _extract_json_array(text: str) -> str | None:
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None
