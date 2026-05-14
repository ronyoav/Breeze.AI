export function buildAttractionPrompt(params: {
  city: string;
  category: string;
  budget: string;
  composition: string;
  rawData: unknown[];
}): string {
  return `You are an expert travel researcher for ${params.city}.

Category: ${params.category}
Traveler type: ${params.composition}
Budget: ${params.budget}

Raw data from APIs:
${JSON.stringify(params.rawData, null, 2)}

Clean and enrich this list. Return ONLY valid JSON — an array of attraction objects:
[
  {
    "id": "unique-string",
    "name": "Place Name",
    "category": "${params.category}",
    "description": "2–3 sentence engaging description",
    "address": "street, neighborhood",
    "rating": 4.5,
    "priceLevel": 2,
    "openingHours": "09:00–18:00 daily",
    "tip": "one insider tip"
  }
]

Rules:
- Remove duplicates and low-quality results.
- Keep 8–12 of the best options.
- Descriptions must be engaging and factual — no filler.
- priceLevel: 1=budget, 2=mid, 3=upscale, 4=luxury. Filter to match budget tier.
- Output ONLY the JSON array.`;
}
