export interface TripAnswers {
  departure: string;
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

export interface WeatherData {
  kind: string;
  high: number;
  low: number;
}

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
  weather: WeatherData;
  cost: number;
  blocks: DayBlock[];
}
