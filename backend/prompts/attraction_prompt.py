import json


def build_attraction_prompt(
    city: str,
    category: str,
    budget: str,
    composition: str,
    raw_data: list,
) -> str:
    return f"""You are an expert travel researcher for {city}.

Category: {category}
Traveler type: {composition}
Budget: {budget}

Raw data from APIs:
{json.dumps(raw_data, indent=2)}

Clean and enrich this list. Return ONLY valid JSON — an array of attraction objects:
[
  {{
    "id": "unique-string",
    "name": "Place Name",
    "category": "{category}",
    "description": "2–3 sentence engaging description",
    "address": "street, neighborhood",
    "rating": 4.5,
    "price_level": 2,
    "opening_hours": "09:00–18:00 daily",
    "tip": "one insider tip"
  }}
]

Rules:
- Remove duplicates and low-quality results.
- Keep 8–12 of the best options.
- Descriptions must be engaging and factual — no filler.
- price_level: 1=budget, 2=mid, 3=upscale, 4=luxury. Filter to match budget tier.
- Output ONLY the JSON array."""
