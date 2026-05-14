import Anthropic from "@anthropic-ai/sdk";
import { runAttractionManager } from "./attraction-manager";
import { runScheduler } from "./scheduler";
import { buildOrchestratorPrompt, buildFeedbackPrompt } from "@/lib/prompts/orchestrator-prompt";

export interface TripInput {
  city: string;
  departure: string;
  startDate: string;
  endDate: string;
  days: number;
  composition: string;
  budget: string;
  interests: string[];
}

export interface ItinerarySlot {
  time: string;
  duration: string;
  title: string;
  category: string;
  description: string;
  address: string;
  price: string;
  tip: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  slots: ItinerarySlot[];
}

export interface GeneratedItinerary {
  days: ItineraryDay[];
}

const client = new Anthropic();

export async function generateItinerary(input: TripInput): Promise<GeneratedItinerary> {
  // Step 1: fetch attractions in parallel via AttractionManager
  const attractionPool = await runAttractionManager({
    city: input.city,
    budget: input.budget,
    composition: input.composition,
    interests: input.interests,
    startDate: input.startDate,
    endDate: input.endDate,
    days: input.days,
  });

  // Step 2: schedule attractions into days
  const schedule = await runScheduler({
    city: input.city,
    days: input.days,
    startDate: input.startDate,
    attractionPool,
  });

  // Step 3: Orchestrator builds the final narrative itinerary
  const scheduledAttractions = schedule.map((day) => ({
    ...day,
    attractions: day.attractionIds.map((id) => attractionPool.find((a) => a.id === id)).filter(Boolean),
  }));

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content:
          buildOrchestratorPrompt({
            city: input.city,
            days: input.days,
            departure: input.departure,
            composition: input.composition,
            budget: input.budget,
            interests: input.interests,
          }) +
          `\n\nScheduled attractions by day:\n${JSON.stringify(scheduledAttractions, null, 2)}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? (JSON.parse(jsonMatch[0]) as GeneratedItinerary) : { days: [] };
}

export async function refineFeedback(
  feedback: string,
  currentItinerary: GeneratedItinerary
): Promise<GeneratedItinerary> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: buildFeedbackPrompt(feedback, currentItinerary),
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? (JSON.parse(jsonMatch[0]) as GeneratedItinerary) : currentItinerary;
}
