"use client";

import { useState } from "react";
import { IconBtn, Icon, Wordmark } from "./ui";
import type { TripAnswers, GeneratedItinerary, ItineraryDay, ItinerarySlot } from "./types";

function fmtDisplay(d: string): string {
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------- Category config -------------------------------------------
const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  restaurants: { icon: "utensils", color: "#f59e0b", label: "Restaurant" },
  treks:       { icon: "map",      color: "#22c55e", label: "Hike & Tour" },
  music:       { icon: "music",    color: "#f43f5e", label: "Live Music" },
  nightlife:   { icon: "moon",     color: "#8b5cf6", label: "Nightlife" },
  history:     { icon: "clock",    color: "#3b82f6", label: "History" },
  sports:      { icon: "activity", color: "#eab308", label: "Sports" },
  extreme:     { icon: "zap",      color: "#ef4444", label: "Adventure" },
  beach:       { icon: "sun",      color: "#06b6d4", label: "Beach" },
  spa:         { icon: "heart",    color: "#ec4899", label: "Spa" },
  shopping:    { icon: "bag",      color: "#f97316", label: "Shopping" },
  viral:       { icon: "sparkle",  color: "#a855f7", label: "Viral Spot" },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? { icon: "star", color: "var(--accent-deep)", label: category };
}

// ---------- Slot card --------------------------------------------------
function SlotCard({ slot, isLast }: { slot: ItinerarySlot; isLast: boolean }) {
  const [hover, setHover] = useState(false);
  const meta = getCategoryMeta(slot.category);

  return (
    <div style={{ display: "flex", gap: 0, position: "relative" }}>
      {/* Time + timeline */}
      <div style={{ width: 68, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", paddingRight: 16, paddingTop: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>
          {slot.time}
        </span>
        {slot.duration && (
          <span style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{slot.duration}</span>
        )}
      </div>

      {/* Dot + vertical line */}
      <div style={{ width: 24, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
        <div style={{
          width: 12, height: 12, borderRadius: 999, flexShrink: 0,
          background: meta.color,
          border: `2.5px solid ${meta.color}`,
          boxShadow: `0 0 0 3px ${meta.color}22`,
        }} />
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: "var(--border)", marginTop: 6, minHeight: 40 }} />
        )}
      </div>

      {/* Card */}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          flex: 1,
          marginLeft: 16,
          marginBottom: isLast ? 0 : 20,
          padding: "16px 20px",
          background: hover ? "var(--bg-3)" : "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-l)",
          transition: "all .25s var(--ease)",
          transform: hover ? "translateY(-1px)" : "none",
          boxShadow: hover ? "0 8px 20px rgba(10,27,46,.07)" : "none",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `${meta.color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={meta.icon} size={14} stroke={meta.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.01em" }}>
                {slot.title}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                padding: "2px 8px", borderRadius: 999,
                background: `${meta.color}18`,
                color: meta.color,
                border: `1px solid ${meta.color}40`,
              }}>
                {meta.label}
              </span>
              {slot.price && (
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{slot.price}</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {slot.description && (
          <p style={{ margin: "0 0 8px 38px", fontSize: 13, lineHeight: 1.6, color: "var(--text-2)" }}>
            {slot.description}
          </p>
        )}

        {/* Address + tip */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginLeft: 38 }}>
          {slot.address && (
            <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="pin" size={11} stroke="var(--text-3)" />{slot.address}
            </span>
          )}
          {slot.tip && (
            <span style={{
              fontSize: 12, color: "var(--accent-deep)",
              background: "var(--accent-soft)", border: "1px solid var(--accent)",
              padding: "2px 9px", borderRadius: 999,
            }}>
              {slot.tip}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Day view --------------------------------------------------
function DayView({ day }: { day: ItineraryDay }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 4 }}>
          Day {day.day}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>{day.date}</div>
        {day.theme && (
          <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 4, fontStyle: "italic" }}>{day.theme}</div>
        )}
      </div>

      <div>
        {day.slots.map((slot, i) => (
          <SlotCard key={`${slot.time}-${i}`} slot={slot} isLast={i === day.slots.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ---------- Day tabs --------------------------------------------------
function DayTabs({ days, activeDay, onSelect }: { days: ItineraryDay[]; activeDay: number; onSelect: (d: number) => void }) {
  return (
    <div style={{
      display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
      scrollbarWidth: "none", msOverflowStyle: "none",
      marginBottom: 40,
    }}>
      {days.map((day) => {
        const active = day.day === activeDay;
        return (
          <button
            key={day.day}
            onClick={() => onSelect(day.day)}
            style={{
              padding: "10px 18px", borderRadius: "var(--r)", flexShrink: 0,
              background: active ? "var(--ink)" : "var(--bg-2)",
              border: `1px solid ${active ? "var(--ink)" : "var(--border)"}`,
              color: active ? "#fff" : "var(--text-2)",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all .2s var(--ease)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", opacity: active ? 0.7 : 0.6 }}>
              Day {day.day}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>{day.date}</div>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Top bar ---------------------------------------------------
function SmallActionBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px 9px 12px",
        borderRadius: 999, background: hover ? "var(--bg-2)" : "transparent",
        border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 13, fontWeight: 500,
        transition: "background .25s var(--ease)", fontFamily: "inherit", cursor: "pointer",
      }}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

function ItineraryTopBar({ answers, dark, onToggle, onRestart }: { answers: TripAnswers; dark: boolean; onToggle: () => void; onRestart: () => void }) {
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Wordmark size={22} />
        <span style={{ width: 1, height: 24, background: "var(--border)" }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.01em" }}>
            {answers.destination} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>·</span> {answers.dates.days} days
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>
            {fmtDisplay(answers.dates.start)} – {fmtDisplay(answers.dates.end)}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SmallActionBtn icon="refresh" label="Restart" onClick={onRestart} />
        <SmallActionBtn icon="download" label="Export PDF" />
        <SmallActionBtn icon="share" label="Share" />
        <IconBtn onClick={onToggle} label={dark ? "light" : "dark"}>
          <Icon name={dark ? "sun" : "moon"} size={18} />
        </IconBtn>
      </div>
    </header>
  );
}

// ---------- Sidebar ---------------------------------------------------
const BUDGET_LABEL: Record<string, string> = { budget: "Budget", comfort: "Comfort", luxury: "Luxury" };

const INTEREST_META: Record<string, { label: string; icon: string }> = {
  restaurants: { label: "Restaurants", icon: "utensils" },
  treks:       { label: "Hikes & Tours", icon: "map" },
  music:       { label: "Live Concerts", icon: "music" },
  nightlife:   { label: "Nightlife", icon: "moon" },
  history:     { label: "History & Culture", icon: "clock" },
  sports:      { label: "Sports", icon: "activity" },
  extreme:     { label: "Adventure", icon: "zap" },
  beach:       { label: "Beach & Resorts", icon: "sun" },
  spa:         { label: "Spa & Wellness", icon: "heart" },
  shopping:    { label: "Shopping", icon: "bag" },
  viral:       { label: "Viral Spots", icon: "sparkle" },
};

function TripSidebar({ answers, days, activeDay, onSelectDay }: {
  answers: TripAnswers;
  days: ItineraryDay[];
  activeDay: number;
  onSelectDay: (d: number) => void;
}) {
  const comp = answers.composition === "couple" ? "Couple" : answers.composition === "solo" ? "Solo" : answers.composition === "family" ? "Family" : "Friends";
  return (
    <aside style={{ borderRight: "1px solid var(--border)", padding: "28px 18px", position: "sticky", top: 78, alignSelf: "flex-start", height: "calc(100vh - 78px)", overflowY: "auto" }}>
      <div style={{ padding: "16px 14px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.01em", marginBottom: 10 }}>{answers.destination}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="calendar" size={13} stroke="var(--text-3)" />
            {fmtDisplay(answers.dates.start)} – {fmtDisplay(answers.dates.end)}
            <span style={{ color: "var(--text-3)" }}>· {answers.dates.days}d</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="users" size={13} stroke="var(--text-3)" />{comp}
            {answers.ages && <span style={{ color: "var(--text-3)" }}>· {answers.ages}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="wallet" size={13} stroke="var(--text-3)" />{BUDGET_LABEL[answers.budget] ?? answers.budget}
          </div>
        </div>
      </div>

      {/* Day nav */}
      {days.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>
            Days
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 20 }}>
            {days.map((day) => (
              <button
                key={day.day}
                onClick={() => onSelectDay(day.day)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  borderRadius: "var(--r)", background: activeDay === day.day ? "var(--ink)" : "transparent",
                  border: `1px solid ${activeDay === day.day ? "var(--ink)" : "transparent"}`,
                  color: activeDay === day.day ? "#fff" : "var(--text-2)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  transition: "all .2s var(--ease)", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, width: 32, flexShrink: 0 }}>Day {day.day}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{day.date}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Interests legend */}
      <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>
        Interests
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {answers.interests.map((id) => {
          const meta = INTEREST_META[id];
          const catMeta = getCategoryMeta(id);
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: "var(--r)", background: "var(--bg-2)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
              <Icon name={meta?.icon ?? "star"} size={13} stroke={catMeta.color} />
              {meta?.label ?? id}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ---------- Feedback bar & overlay ------------------------------------
function FeedbackBar({ onOpen }: { onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ marginTop: 54, padding: "24px 28px", background: "var(--ink)", color: "#fff", borderRadius: "var(--r-xl)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
      <div>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>Love it, or want changes?</div>
        <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginTop: 4 }}>Tell us in plain English — we&apos;ll re-plan the right slice.</div>
      </div>
      <button
        onClick={onOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 999, background: hover ? "var(--lemon)" : "rgba(245,224,74,.85)", color: "var(--ink)", border: "none", fontSize: 13, fontWeight: 600, transition: "background .2s", fontFamily: "inherit", cursor: "pointer" }}
      >
        <Icon name="sparkle" size={16} />
        Ask Breeze to fix
      </button>
    </div>
  );
}

function FeedbackOverlay({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(5,15,25,.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ background: "var(--bg-2)", borderRadius: "var(--r-xl)", border: "1px solid var(--border)", maxWidth: 600, width: "100%", padding: "36px 36px 28px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: 999, background: "var(--bg-3)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "inherit" }}>
          <Icon name="x" size={16} />
        </button>
        <h2 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 500, letterSpacing: "-.02em" }}>
          What would <span className="serif">make this better?</span>
        </h2>
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: 14, lineHeight: 1.5 }}>
          Plain English works — &quot;less walking&quot;, &quot;more seafood&quot;, &quot;swap the museum for a beach day&quot;.
        </p>
        <textarea
          autoFocus value={text} onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I'd swap the monastery for a long lunch with a view…"
          style={{ marginTop: 20, width: "100%", minHeight: 120, padding: "14px 16px", fontSize: 15, lineHeight: 1.5, border: "1px solid var(--border)", borderRadius: "var(--r)", outline: "none", background: "var(--bg)", color: "var(--text)", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "11px 18px", borderRadius: 999, fontSize: 14, fontWeight: 500, color: "var(--text-2)", fontFamily: "inherit", cursor: "pointer", background: "transparent", border: "none" }}>Cancel</button>
          <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", background: "var(--ink)", color: "#fff", borderRadius: 999, fontSize: 15, fontWeight: 600, border: "none", fontFamily: "inherit", cursor: "pointer" }}>
            Re-plan with this <Icon name="sparkle" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main screen -----------------------------------------------
interface Props {
  answers: TripAnswers;
  generatedItinerary: GeneratedItinerary;
  onRestart: () => void;
  dark: boolean;
  onToggle: () => void;
}

export default function ItineraryScreen({ answers, generatedItinerary, onRestart, dark, onToggle }: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const days = generatedItinerary.days ?? [];
  const [activeDay, setActiveDay] = useState(days[0]?.day ?? 1);

  const currentDay = days.find((d) => d.day === activeDay) ?? days[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <ItineraryTopBar answers={answers} dark={dark} onToggle={onToggle} onRestart={onRestart} />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", maxWidth: 1440, margin: "0 auto", paddingTop: 78 }}>
        <TripSidebar answers={answers} days={days} activeDay={activeDay} onSelectDay={setActiveDay} />

        <main style={{ padding: "36px 48px 120px", minWidth: 0 }}>
          {days.length === 0 ? (
            <div style={{ paddingTop: 80, textAlign: "center", color: "var(--text-3)", fontSize: 15 }}>
              No itinerary generated. Try restarting with different preferences.
            </div>
          ) : (
            <>
              <DayTabs days={days} activeDay={activeDay} onSelect={setActiveDay} />
              {currentDay && <DayView day={currentDay} />}
            </>
          )}

          <FeedbackBar onOpen={() => setFeedbackOpen(true)} />
        </main>
      </div>

      {feedbackOpen && <FeedbackOverlay onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
