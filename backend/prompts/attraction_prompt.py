import json

def build_attraction_prompt(
    input_data: dict,
    raw_data: list,
) -> str:
    return f"""You are an expert travel researcher assembling a highly curated itinerary.

User Context:
{json.dumps(input_data, indent=2)}

Raw data from sub-agents:
{json.dumps(raw_data, indent=2)}

Your task is to organize, filter, and enrich these attractions into the exact required JSON format.
Group the attractions by their category (which corresponds to the user's "interests").

Return ONLY valid JSON with this exact format:
[
  {{
    "type": "history",
    "results": [
      {{
        "id": "123",
        "name": "Place Name",
        "address": "123 Street",
        "coordinates": {{"lat": 48.855, "lng": 2.312}},
        "description": "Engaging 1-2 sentence description.",
        "imageurl": "https://...",
        "ageRange": "All ages",
        "reviews": 4.8,
        "prices": 2,
        "notes": "Accessibility or general notes.",
        "specialNotes": "Why this matches.",
        "subAgentScore": 9.5,
        "scoresLog": [9.5]
      }}
    ]
  }}
]

Rules:
- Filter to keep the absolute best 3-6 options per type.
- ONLY fill in `ageRange` and `subAgentScore` if they do not exist.
- DO NOT invent `reviews`, `prices`, `notes`, or `specialNotes` if they are missing from the raw data; omit them or set them to null.
- "subAgentScore" is a float out of 10.0 representing how well it fits the user context. "scoresLog" must be an array with exactly one element: the initial "subAgentScore".
- descriptions must be engaging and factual — no filler.
- Output ONLY the JSON array."""

def build_rescore_prompt(
    previous_output: list[dict],
    user_prompt: str
) -> str:
    return f"""You are an expert travel agent refining an itinerary based on user feedback.

Previous Output:
{json.dumps(previous_output, indent=2)}

User Feedback: "{user_prompt}"

Your task is to update the scores of the attractions based on the user's feedback.
- Adjust "subAgentScore" for the relevant items (e.g., lower it if the user dislikes the category, raise it if they want more of it).
- Append the new score to the end of the "scoresLog" array.
- You can remove items that are completely rejected.
- You may adjust "specialNotes" to reflect the user's feedback if relevant.

Return ONLY the updated JSON array in the exact same format:
[
  {{
    "type": "history",
    "results": [ ... ]
  }}
]"""
