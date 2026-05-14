import os
import json
from typing import Optional
from anthropic import Anthropic, AsyncAnthropic
from langsmith.wrappers import wrap_anthropic

# OpenRouter configuration using the Anthropic SDK
OPENROUTER_BASE_URL = "https://openrouter.ai/api"
API_KEY = os.getenv("API_KEY_LLM")

# Sync client (for existing code like orchestrator.py)
# Wrapped with LangSmith for automatic tracing!
client = wrap_anthropic(Anthropic(
    base_url=OPENROUTER_BASE_URL,
    api_key=API_KEY
))

# Async client (recommended for new sub-agents for better performance)
# Wrapped with LangSmith for automatic tracing!
async_client = wrap_anthropic(AsyncAnthropic(
    base_url=OPENROUTER_BASE_URL,
    api_key=API_KEY
))

# OpenRouter model strings
# Note: OpenRouter requires the "provider/" prefix for models
MODEL_HAIKU = "anthropic/claude-3-5-haiku-20241022"

def build_subagent_prompt(user_profile: dict, agent_type: str, extra_instructions: str) -> str:
    profile_json = json.dumps(user_profile, indent=2)
    return f"""You are the `{agent_type}` Sub-Agent for Breeze.AI, an elite AI travel orchestrator.
Your sole responsibility is to curate, filter, and score raw attractions based strictly on the user's profile.

================================================================================
PART 1: THE USER PROFILE
================================================================================
You must analyze this user profile carefully. Every decision you make MUST be justified by this data:
<user_profile>
{profile_json}
</user_profile>

================================================================================
PART 2: SPECIFIC AGENT RULES & FILTERING
================================================================================
You will receive a raw JSON list of spots from external APIs. You must evaluate them based on these strict rules:

{extra_instructions}

================================================================================
PART 3: SCORING MECHANIC (`subAgentScore`)
================================================================================
You must assign a `subAgentScore` (1.0 to 10.0) to every item you return:
- 9.0 to 10.0: A perfect match for their budget, ages, AND interests.
- 7.0 to 8.9: A solid choice that fits most of their profile.
- Below 7.0: Do not return the item. We only want high-quality recommendations.

You must also append this new score to the end of the `scoresLog` array.

================================================================================
PART 4: OUTPUT SCHEMA REQUIREMENTS
================================================================================
You must return EXACTLY 5 to 15 items. If the raw data contains fewer than 5 items, return all valid items.

You must output ONLY a raw JSON object matching this exact schema. Do not output markdown code blocks (```json). Do not output conversational text. 
Failure to follow this exact schema will crash the backend.

{{
  "type": "{agent_type}",
  "results": [
    {{
      "name": "<String: The exact name of the spot>",
      "address": "<String: The street address, or null if unknown>",
      "coordinates": {{ "lat": <Float>, "lng": <Float> }},
      "description": "<String: 2-3 sentences highly tailored to the user profile explaining WHY they will like it>",
      "imageurl": "<String or null>",
      "ageRange": [<Int: Min Age>, <Int: Max Age>],
      "reviews": <Float or null>,
      "prices": <Int: 1, 2, or 3 representing the cost level>,
      "notes": "<String: General practical notes like 'Wheelchair accessible'>",
      "specialNotes": "<String: Why this is special for this specific user group>",
      "subAgentScore": <Float: 1.0 to 10.0>,
      "scoresLog": [<Float>]
    }}
  ]
}}"""

def extract_json_object(text: str) -> Optional[str]:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return text[start : end + 1]
    return None