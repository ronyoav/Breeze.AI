import React from "react";
import type { TravelPreferences } from "../types";
import "./SummaryCard.css";

interface Props {
  prefs: TravelPreferences;
  onSubmit: () => void;
  loading: boolean;
  submitted: boolean;
}

const rows: { label: string; icon: string; key: keyof TravelPreferences }[] = [
  { label: "Departure", icon: "📅", key: "departureDate" },
  { label: "Duration", icon: "⏳", key: "duration" },
  { label: "Destination", icon: "🌍", key: "destination" },
  { label: "Budget", icon: "💳", key: "budget" },
  { label: "Group", icon: "👥", key: "groupType" },
  { label: "Experience", icon: "🎯", key: "purpose" },
];

export const SummaryCard: React.FC<Props> = ({
  prefs,
  onSubmit,
  loading,
  submitted,
}) => {
  return (
    <div className="summary-card">
      <div className="summary-header">
        <span className="summary-icon">🗺️</span>
        <div>
          <h3>Your Trip Overview</h3>
          <p>Confirm the details and I'll build your personalised guide!</p>
        </div>
      </div>
      <div className="summary-rows">
        {rows.map(({ label, icon, key }) => (
          <div className="summary-row" key={key}>
            <span className="summary-row-icon">{icon}</span>
            <span className="summary-row-label">{label}</span>
            <span className="summary-row-value">{prefs[key]}</span>
          </div>
        ))}
      </div>
      <button
        className="find-btn"
        onClick={onSubmit}
        disabled={loading || submitted}
        type="button"
      >
        {loading ? (
          <span className="spinner" />
        ) : submitted ? (
          "Request Sent ✓"
        ) : (
          "Build My Guide 🗺️"
        )}
      </button>
    </div>
  );
};
