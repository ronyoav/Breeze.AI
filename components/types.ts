export interface TripAnswers {
  destination: string;
  dates: { start: string; end: string; days: number };
  composition: string | null;
  budget: string;
  interests: string[];
}

export type Screen =
  | "welcome"
  | "q-departure"
  | "q-dates"
  | "q-composition"
  | "q-budget"
  | "preferences"
  | "generating"
  | "itinerary";


export interface ActivitySlot {
  time: string;
  duration: string;
  title: string;
  desc: string;
  tag: string;
  source: string;
  map: number;
  area: string;
}

export interface DayBlock {
  time: "morning" | "afternoon" | "evening";
  slots: ActivitySlot[];
}

export interface ItineraryDay {
  day: number;
  weekday: string;
  date: string;
  area: string;
  subtitle: string;
  cost: number;
  blocks: DayBlock[];
}
