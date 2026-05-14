import type { DestinationData } from "./destinationData";

export interface TravelPreferences {
  departureDate: string;
  duration: string;
  destination: string;
  budget: "low" | "medium" | "high";
  groupType: string;
  purpose: string;
}

export type StepId =
  | "departure"
  | "duration"
  | "destination"
  | "budget"
  | "group"
  | "purpose"
  | "done";

export interface ChatMessage {
  id: string;
  role: "agent" | "user";
  text: string;
}

export interface ChipGroup {
  label: string;
  chips: string[];
}

export interface Step {
  id: StepId;
  agentMessage: string;
  inputType: "date" | "text" | "chips" | "drilldown" | "compound-chips";
  chips?: string[];
  chipGroups?: ChipGroup[];
  multiSelect?: boolean;
  placeholder?: string;
  prefKey: keyof TravelPreferences;
  // drilldown (continent → country → city)
  drilldown?: DestinationData;
  // compound-chips (pick one per row, joined)
  compoundGroups?: { chips: string[] }[];
}
