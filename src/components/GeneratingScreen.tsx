"use client";

import { useState, useEffect, useRef } from "react";
import { TopBar, Icon } from "./ui";
import type { TripAnswers, AttractionItem, ItineraryData, GeneratedItinerary } from "./types";

const INTEREST_META: Record<string, { label: string; icon: string }> = {
  restaurants: { label: "Scouting the best restaurants", icon: "utensils" },
  treks:       { label: "Mapping trails and guided tours", icon: "map" },
  music:       { label: "Checking live concerts for your dates", icon: "music" },
  nightlife:   { label: "Discovering bars and nightlife", icon: "moon" },
  history:     { label: "Exploring historical sites", icon: "clock" },
  sports:      { label: "Finding sports events and venues", icon: "activity" },
  extreme:     { label: "Locating adventure activities", icon: "zap" },
  beach:       { label: "Scouting beaches and resorts", icon: "sun" },
  spa:         { label: "Finding spas and wellness centres", icon: "heart" },
  shopping:    { label: "Mapping markets and boutiques", icon: "bag" },
  viral:       { label: "Tracking the city's trending spots", icon: "sparkle" },
};

// Parses both ISO ("2026-05-14") and "May 14" style strings
function parseTripDate(label: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;
  const now = new Date();
  const attempt = new Date(`${label} ${now.getFullYear()}`);
  if (!isNaN(attempt.getTime())) {
    const attemptVal = attempt.getMonth() * 100 + attempt.getDate();
    const nowVal = now.getMonth() * 100 + now.getDate();
    if (attemptVal < nowVal) attempt.setFullYear(now.getFullYear() + 1);
    
    const yyyy = attempt.getFullYear();
    const mm = String(attempt.getMonth() + 1).padStart(2, '0');
    const dd = String(attempt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function callAgent(
  interest: string,
  answers: TripAnswers
): Promise<AttractionItem[]> {
  const city = encodeURIComponent(answers.destination);
  const budget = answers.budget;
  const startDate = parseTripDate(answers.dates.start);
  const endDate = parseTripDate(answers.dates.end);

  try {
    let res: Response;
    if (interest === "restaurants") {
      res = await fetch(`/api/restaurants?city=${city}&budget=${budget}&days=${answers.dates.days}`);
      const d = await res.json();
      return d.restaurants ?? [];
    }
    if (interest === "treks") {
      res = await fetch(`/api/treks?city=${city}&days=${answers.dates.days}`);
      const d = await res.json();
      return d.treks ?? [];
    }
    if (interest === "music") {
      res = await fetch(`/api/concerts?city=${city}&startDate=${startDate}&endDate=${endDate}&days=${answers.dates.days}`);
      const d = await res.json();
      return d.concerts ?? [];
    }
    // Generic agent for all other categories
    res = await fetch(`/api/attractions?city=${city}&category=${interest}&budget=${budget}&days=${answers.dates.days}`);
    const d = await res.json();
    return d.attractions ?? [];
  } catch {
    return [];
  }
}

interface Props {
  answers: TripAnswers;
  onDone: (itinerary: GeneratedItinerary) => void;
  dark: boolean;
  onToggle: () => void;
}

type TaskStatus = "pending" | "loading" | "done" | "empty";

export default function GeneratingScreen({ answers, onDone, dark, onToggle }: Props) {
  const interests = answers.interests;
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(
    () => Object.fromEntries(interests.map((id) => [id, "pending"]))
  );
  const [schedulingStatus, setSchedulingStatus] = useState<"idle" | "loading" | "done">("idle");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (interests.length === 0) {
      onDone({ days: [] });
      return;
    }

    const results: ItineraryData = {};

    // Mark all as loading then fire each agent
    setStatuses(Object.fromEntries(interests.map((id) => [id, "loading"])));

    Promise.allSettled(
      interests.map(async (interest) => {
        const items = await callAgent(interest, answers);
        results[interest] = items;
        setStatuses((prev) => ({
          ...prev,
          [interest]: items.length > 0 ? "done" : "empty",
        }));
      })
    ).then(async () => {
      const allItems: AttractionItem[] = Object.values(results).flat();

      setSchedulingStatus("loading");
      try {
        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: allItems,
            city: answers.destination,
            days: answers.dates.days,
            startDate: answers.dates.start,
            composition: answers.composition ?? "friends",
            budget: answers.budget,
            interests: answers.interests,
            travelers: answers.travelers,
          }),
        });
        const itinerary: GeneratedItinerary = await res.json();
        itinerary.pool = allItems;
        setSchedulingStatus("done");
        onDone(itinerary);
      } catch {
        setSchedulingStatus("done");
        onDone({ days: [] });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comp =
    answers.composition === "couple" ? "Couple" :
    answers.composition === "solo"   ? "Solo"   :
    answers.composition === "family" ? "Family" : "Friends";

  const dateLabel = (() => {
    const s = answers.dates.start;
    const e = answers.dates.end;
    const fmt = (d: string) => {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return d;
      return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    return `${fmt(s)} – ${fmt(e)}`;
  })();

  const doneCount = Object.values(statuses).filter((s) => s === "done" || s === "empty").length;
  const total = interests.length;

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
          Building your trip
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

        {/* Agent tasks */}
        <div style={{ marginTop: 56, width: "100%", maxWidth: 680, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Scheduling step — shown after all agents finish */}
          {doneCount === total && total > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "14px 18px",
                borderRadius: "var(--r)",
                background: schedulingStatus === "loading" ? "var(--bg-2)" : "transparent",
                border: "1px solid",
                borderColor: schedulingStatus === "loading" ? "var(--border)" : "transparent",
                transition: "all .4s var(--ease)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: schedulingStatus === "done" ? "var(--accent)" : schedulingStatus === "loading" ? "var(--lemon)" : "transparent",
                  border: "1.5px solid",
                  borderColor: schedulingStatus === "done" ? "var(--accent)" : schedulingStatus === "loading" ? "var(--lemon)" : "var(--border)",
                  flex: "0 0 26px",
                  transition: "all .4s var(--ease)",
                }}
              >
                {schedulingStatus === "done" && <Icon name="check" size={16} stroke="#fff" strokeWidth={2.4} />}
                {schedulingStatus === "loading" && (
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--ink)", animation: "pulse 1.2s ease-in-out infinite" }} />
                )}
              </div>
              <Icon name="calendar" size={16} stroke={schedulingStatus === "done" ? "var(--accent)" : "var(--text-3)"} />
              <span
                style={{
                  fontSize: 17,
                  fontWeight: schedulingStatus === "loading" ? 600 : 500,
                  color: schedulingStatus === "done" ? "var(--text-2)" : schedulingStatus === "loading" ? "var(--text)" : "var(--text-3)",
                  textDecorationLine: schedulingStatus === "done" ? "line-through" : "none",
                  textDecorationColor: "rgba(10,27,46,.2)",
                }}
              >
                Building your calendar itinerary
              </span>
            </div>
          )}
          {interests.map((id) => {
            const meta = INTEREST_META[id] ?? { label: id, icon: "star" };
            const status = statuses[id] ?? "pending";
            const isDone = status === "done" || status === "empty";
            const isLoading = status === "loading";

            return (
              <div
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "14px 18px",
                  borderRadius: "var(--r)",
                  background: isLoading ? "var(--bg-2)" : "transparent",
                  border: "1px solid",
                  borderColor: isLoading ? "var(--border)" : "transparent",
                  opacity: isDone || isLoading ? 1 : 0.35,
                  transition: "all .4s var(--ease)",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone ? "var(--accent)" : isLoading ? "var(--lemon)" : "transparent",
                    border: "1.5px solid",
                    borderColor: isDone ? "var(--accent)" : isLoading ? "var(--lemon)" : "var(--border)",
                    flex: "0 0 26px",
                    transition: "all .4s var(--ease)",
                  }}
                >
                  {isDone && <Icon name="check" size={16} stroke="#fff" strokeWidth={2.4} />}
                  {isLoading && (
                    <div
                      style={{
                        width: 8, height: 8, borderRadius: 999,
                        background: "var(--ink)",
                        animation: "pulse 1.2s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <Icon name={meta.icon} size={16} stroke={isDone ? "var(--accent)" : "var(--text-3)"} />
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: isLoading ? 600 : 500,
                    color: isDone ? "var(--text-2)" : isLoading ? "var(--text)" : "var(--text-3)",
                    textDecorationLine: isDone ? "line-through" : "none",
                    textDecorationColor: "rgba(10,27,46,.2)",
                  }}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress footer */}
        <div style={{ marginTop: 48, color: "var(--text-3)", fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase" }}>
          {doneCount < total
            ? `${doneCount} / ${total} agents done`
            : schedulingStatus === "loading"
            ? "Scheduling your days…"
            : "Finalising your trip…"}
        </div>
      </main>
    </div>
  );
}
