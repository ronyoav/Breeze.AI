export interface TripAnswers {
  destination: string;
  dates: { start: string; end: string; days: number };
  composition: string | null;
  ages?: string;
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

// Unified type used across all interest agents
export interface AttractionItem {
  id: string;
  name: string;
  description: string;
  address?: string;
  url?: string;
  tip?: string;
  // Concerts
  date?: string;
  venue?: string;
  image?: string;
  source?: string;
  // Restaurants
  cuisine?: string;
  priceRange?: string;
}

// Map of interest id → fetched items (kept for GeneratingScreen internal use)
export type ItineraryData = Record<string, AttractionItem[]>;

// Calendar-based itinerary output from the scheduler
export interface ItinerarySlot {
  time: string;
  duration: string;
  title: string;
  category: string;
  description: string;
  address?: string;
  price?: string;
  tip?: string;
  url?: string;
  isDinner?: boolean;
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
