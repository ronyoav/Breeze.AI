import Anthropic from "@anthropic-ai/sdk";
import type { Attraction } from "@/lib/utils/parsers";
import { buildAttractionPrompt } from "@/lib/prompts/attraction-prompt";

import { fetchRestaurants } from "./sub-agents/restaurants";
import { fetchNightlife } from "./sub-agents/nightlife";
import { fetchHistory } from "./sub-agents/history";
import { fetchSports } from "./sub-agents/sports";
import { fetchExtreme } from "./sub-agents/extreme";
import { fetchTreks } from "./sub-agents/treks";
import { fetchBeach } from "./sub-agents/beach";
import { fetchSpa } from "./sub-agents/spa";
import { fetchEvents } from "./sub-agents/events";
import { fetchShopping } from "./sub-agents/shopping";
import { fetchViral } from "./sub-agents/viral";

export interface AttractionManagerParams {
  city: string;
  budget: string;
  composition: string;
  interests: string[];
  startDate: string;
  endDate: string;
  days: number;
}

const client = new Anthropic();

export async function runAttractionManager(
  params: AttractionManagerParams
): Promise<Attraction[]> {
  const fetchers: Record<string, () => Promise<Attraction[]>> = {
    restaurants: () => fetchRestaurants({ city: params.city, budget: params.budget, days: params.days }),
    nightlife: () => fetchNightlife({ city: params.city, budget: params.budget }),
    history: () => fetchHistory({ city: params.city }),
    sports: () => fetchSports({ city: params.city }),
    extreme: () => fetchExtreme({ city: params.city }),
    treks: () => fetchTreks({ city: params.city }),
    beach: () => fetchBeach({ city: params.city }),
    spa: () => fetchSpa({ city: params.city, budget: params.budget }),
    events: () => fetchEvents({ city: params.city, startDate: params.startDate, endDate: params.endDate }),
    shopping: () => fetchShopping({ city: params.city, budget: params.budget }),
    viral: () => fetchViral({ city: params.city }),
  };

  // Only activate sub-agents for selected interests
  const active = params.interests.filter((i) => fetchers[i]);
  const results = await Promise.allSettled(active.map((i) => fetchers[i]()));

  const rawData: Attraction[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") rawData.push(...result.value);
  }

  if (rawData.length === 0) return [];

  // Enrich and clean with Haiku
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildAttractionPrompt({
          city: params.city,
          category: params.interests.join(", "),
          budget: params.budget,
          composition: params.composition,
          rawData,
        }),
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? (JSON.parse(jsonMatch[0]) as Attraction[]) : rawData;
}
