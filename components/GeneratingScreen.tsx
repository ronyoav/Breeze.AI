"use client";

import { useState, useEffect } from "react";
import { TopBar, Icon } from "./ui";
import type { TripAnswers } from "./types";

const GEN_TASKS = [
  { label: "Mapping the city's neighborhoods" },
  { label: "Pulling top restaurants & hidden spots" },
  { label: "Reading 1,200+ recent traveler notes" },
  { label: "Checking live events for your dates" },
  { label: "Sequencing a day-by-day rhythm" },
  { label: "Tuning everything for your interests" },
];

interface Props {
  answers: TripAnswers;
  onDone: () => void;
  dark: boolean;
  onToggle: () => void;
}

export default function GeneratingScreen({ answers, onDone, dark, onToggle }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      setProgress(idx);
      if (idx >= GEN_TASKS.length) {
        clearInterval(interval);
        setTimeout(() => onDone(), 700);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [onDone]);

  const compositionLabel =
    answers.composition === "couple"
      ? "Two travelers"
      : answers.composition === "solo"
      ? "Solo"
      : answers.composition === "family"
      ? "Family"
      : "Friends";

  const budgetLabel =
    answers.budget === "budget" ? "Budget" : answers.budget === "luxury" ? "Luxury" : "Comfort";

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

      {/* ambient */}
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
        <div
          style={{
            color: "var(--text-3)",
            fontSize: 13,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
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
          <span className="serif" style={{ fontSize: "1.1em" }}>
            {answers.dates.start} – {answers.dates.end}
          </span>
          <span style={{ margin: "0 14px", color: "var(--text-3)" }}>·</span>
          {compositionLabel}
          <span style={{ margin: "0 14px", color: "var(--text-3)" }}>·</span>
          {budgetLabel}
        </div>

        <div
          style={{
            marginTop: 64,
            width: "100%",
            maxWidth: 680,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {GEN_TASKS.map((t, i) => {
            const done = i < progress;
            const active = i === progress;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "14px 18px",
                  borderRadius: "var(--r)",
                  background: active ? "var(--bg-2)" : "transparent",
                  border: "1px solid",
                  borderColor: active ? "var(--border)" : "transparent",
                  opacity: done || active ? 1 : 0.35,
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
                    background: done ? "var(--accent)" : active ? "var(--lemon)" : "transparent",
                    border: "1.5px solid",
                    borderColor: done ? "var(--accent)" : active ? "var(--lemon)" : "var(--border)",
                    flex: "0 0 26px",
                    transition: "all .4s var(--ease)",
                  }}
                >
                  {done && <Icon name="check" size={16} stroke="#fff" strokeWidth={2.4} />}
                  {active && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "var(--ink)",
                        animation: "pulse 1.2s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: active ? 600 : 500,
                    color: done ? "var(--text-2)" : active ? "var(--text)" : "var(--text-3)",
                    textDecorationLine: done ? "line-through" : "none",
                    textDecorationColor: "rgba(10,27,46,.2)",
                  }}
                >
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 48,
            color: "var(--text-3)",
            fontSize: 13,
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}
        >
          ~ {Math.max(2, (GEN_TASKS.length - progress) * 2)} seconds left
        </div>
      </main>
    </div>
  );
}
