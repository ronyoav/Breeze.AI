export interface Traveler {
  age: string;
  gender: string;
}

export interface TripAnswers {
  userName: string;
  destination: string;
  country: string;
  dates: { start: string; end: string; days: number };
  composition: string | null;
  travelers: Traveler[];
  budget: string;
  interests: string[];
}

export type Screen =
  | "welcome"
  | "q-name"
  | "q-departure"
  | "q-dates"
  | "q-composition"
  | "q-budget"
  | "preferences"
  | "generating"
  | "itinerary";

// Orchestrator output format
export interface OrchestratorActivity {
  time: string;
  duration: string;
  title: string;
  category: string;
  description: string;
  address?: string;
  price?: string;
  tip?: string;
  imageurl?: string | null;
}

export interface OrchestratorDay {
  day: number;
  date: string;
  title: string;
  summary?: string;
  activities: OrchestratorActivity[];
}

export interface GeneratedItinerary {
  days: OrchestratorDay[];
  pool?: unknown[];
  message?: string;
}

// Legacy attraction types (kept for internal use)
export interface AttractionItem {
  id: string;
  name: string;
  description: string;
  address?: string;
  url?: string;
  tip?: string;
  date?: string;
  venue?: string;
  image?: string;
  source?: string;
  cuisine?: string;
  priceRange?: string;
}

export type ItineraryData = Record<string, AttractionItem[]>;
