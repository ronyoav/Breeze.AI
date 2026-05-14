import type { Step } from "./types";
import { DESTINATION_DATA } from "./destinationData";

export const STEPS: Step[] = [
  {
    id: "destination",
    agentMessage:
      "Hey, welcome! 🗺️ I'm Marco, your personal tour guide.\n\nI'm here to help you get the most out of your trip. So, where are you headed?",
    inputType: "drilldown",
    drilldown: DESTINATION_DATA,
    placeholder: "Or type a city, country…",
    prefKey: "destination",
  },
  {
    id: "departure",
    agentMessage: "Exciting destination! When do you arrive there?",
    inputType: "date",
    prefKey: "departureDate",
  },
  {
    id: "duration",
    agentMessage: "Got it. How long will you be staying?",
    inputType: "compound-chips",
    compoundGroups: [
      { chips: ["1", "2", "3", "4", "5", "6", "7", "10", "14", "21", "30"] },
      { chips: ["Days", "Weeks", "Months"] },
    ],
    prefKey: "duration",
  },
  {
    id: "group",
    agentMessage: "Who are you exploring with?",
    inputType: "chips",
    chips: [
      "Solo 🧍",
      "Couple ❤️",
      "Family 👨‍👩‍👧‍👦",
      "Friends 🎉",
      "Colleagues 💼",
    ],
    prefKey: "groupType",
  },
  {
    id: "budget",
    agentMessage: "What's your budget for activities and experiences?",
    inputType: "chips",
    chips: ["Low 💸", "Medium 💳", "High 💎"],
    prefKey: "budget",
  },
  {
    id: "purpose",
    agentMessage:
      "Last one! What kind of experiences are you excited about? Pick as many as you like!",
    inputType: "chips",
    multiSelect: true,
    chips: [
      "Beach & Resorts 🏖️",
      "Hiking & Nature 🥾",
      "Culture & History 🏛️",
      "City & Nightlife 🌆",
      "Food & Wine 🍷",
      "Adventure & Sports 🏄",
      "Wellness & Spa 🧘",
    ],
    prefKey: "purpose",
  },
];
