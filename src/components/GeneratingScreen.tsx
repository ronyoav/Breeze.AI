"use client";

import { useState, useEffect, useRef } from "react";
import { TopBar, Icon } from "./ui";
import type { TripAnswers, GeneratedItinerary } from "./types";

const BUDGET_MAP: Record<string, number> = { budget: 1, comfort: 2, luxury: 3 };

function buildInputData(answers: TripAnswers): Record<string, unknown> {
  const groupStructure: Record<string, { gender: string; age: number }> = {};
  answers.travelers.forEach((t, i) => {
    groupStructure[String(i + 1)] = {
      gender: t.gender || "other",
      age: parseInt(t.age) || 0,
    };
  });

  return {
    userName: answers.userName || "Traveler",
    groupRelation: answers.composition ?? "solo",
    groupStructure,
    budget: BUDGET_MAP[answers.budget] ?? 2,
    dates: {
      start: answers.dates.start,
      end: answers.dates.end,
    },
    daysNumber: answers.dates.days,
    location: {
      country: answers.country || "",
      city: answers.destination,
    },
    accessibility: false,
    interests: answers.interests,
  };
}

interface Props {
  answers: TripAnswers;
  onDone: (itinerary: GeneratedItinerary) => void;
  dark: boolean;
  onToggle: () => void;
}

export default function GeneratingScreen({ answers, onDone, dark, onToggle }: Props) {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const ran = useRef(false);

  const comp =
    answers.composition === "couple" ? "Couple" :
    answers.composition === "solo"   ? "Solo"   :
    answers.composition === "family" ? "Family" : "Friends";

  const dateLabel = (() => {
    const fmt = (d: string) => {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return d;
      return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    return `${fmt(answers.dates.start)} – ${fmt(answers.dates.end)}`;
  })();

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const input_data = buildInputData(answers);

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_data }),
    })
      .then((r) => r.json())
      .then((data: GeneratedItinerary) => {
        setStatus("done");
        onDone(data);
      })
      .catch(() => {
        setStatus("error");
        onDone({ days: [] });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "100px 60px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <TopBar dark={dark} onToggle={onToggle} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(900px 500px at 75% 25%, var(--accent-soft), transparent 70%)," +
            "radial-gradient(700px 500px at 20% 80%, rgba(245,224,74,.18), transparent 70%)",
        }}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          maxWidth: 920,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ color: "var(--text-3)", fontSize: 13, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 18 }}>
          {status === "error" ? "Something went wrong" : "Building your trip"}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "var(--display)",
            lineHeight: 1.05,
            fontWeight: 500,
            letterSpacing: "-.04em",
            color: "var(--accent)",
            fontVariationSettings: '"opsz" 96',
            textAlign: "center",
          }}
        >
          {answers.destination}
        </h1>

        <div style={{ marginTop: 14, color: "var(--text-2)", fontSize: 18, textAlign: "center" }}>
          <span className="serif" style={{ fontSize: "1.1em" }}>{dateLabel}</span>
          <span style={{ margin: "0 14px", color: "var(--text-3)" }}>·</span>
          {comp}
          <span style={{ margin: "0 14px", color: "var(--text-3)" }}>·</span>
          {answers.budget.charAt(0).toUpperCase() + answers.budget.slice(1)}
        </div>

        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {status === "loading" && (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 999,
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                animation: "spin 0.9s linear infinite",
              }} />
              <div style={{ color: "var(--text-3)", fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase" }}>
                Our agents are crafting your itinerary…
              </div>
              <div style={{ color: "var(--text-3)", fontSize: 13, maxWidth: 380, textAlign: "center", lineHeight: 1.6 }}>
                We're searching for the best {answers.interests.slice(0, 3).join(", ")} experiences in {answers.destination}. This takes about 30–60 seconds.
              </div>
            </>
          )}
          {status === "error" && (
            <div style={{ color: "var(--text-2)", fontSize: 15, textAlign: "center" }}>
              Could not reach the server. Make sure the backend is running on port 8000.
            </div>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
