import Anthropic from "@anthropic-ai/sdk";
import type { Attraction } from "@/lib/utils/parsers";
import { buildSchedulerPrompt } from "@/lib/prompts/scheduler-prompt";

export interface SchedulerParams {
  city: string;
  days: number;
  startDate: string;
  attractionPool: Attraction[];
}

export interface ScheduledDay {
  day: number;
  date: string;
  theme: string;
  attractionIds: string[];
}

const client = new Anthropic();

export async function runScheduler(params: SchedulerParams): Promise<ScheduledDay[]> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: buildSchedulerPrompt({
          city: params.city,
          days: params.days,
          startDate: params.startDate,
          attractionPool: params.attractionPool,
        }),
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? (JSON.parse(jsonMatch[0]) as ScheduledDay[]) : [];
}
