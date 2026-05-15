"use client";

import { useState } from "react";
import { IconBtn, Icon, Wordmark } from "./ui";
import type { TripAnswers, GeneratedItinerary, OrchestratorDay, OrchestratorActivity } from "./types";

const BUDGET_MAP: Record<string, number> = { budget: 1, comfort: 2, luxury: 3 };

function buildInputData(answers: TripAnswers): Record<string, unknown> {
  const groupStructure: Record<string, { gender: string; age: number }> = {};
  answers.travelers.forEach((t, i) => {
    groupStructure[String(i + 1)] = { gender: t.gender || "other", age: parseInt(t.age) || 0 };
  });
  return {
    userName: answers.userName || "Traveler",
    groupRelation: answers.composition ?? "solo",
    groupStructure,
    budget: BUDGET_MAP[answers.budget] ?? 2,
    dates: { start: answers.dates.start, end: answers.dates.end },
    daysNumber: answers.dates.days,
    location: { country: answers.country || "", city: answers.destination },
    accessibility: false,
    interests: answers.interests,
  };
}

function parseLocal(dStr: string): Date {
  const match = dStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function fmtDisplay(d: string): string {
  return parseLocal(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getTrueDate(startDate: string, dayIndex: number): string {
  const d = parseLocal(startDate);
  d.setDate(d.getDate() + (isNaN(dayIndex) ? 0 : dayIndex));
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

// ---------- Category config -------------------------------------------
const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  restaurants: { icon: "utensils", color: "#E8960A", label: "Restaurant" },
  treks:       { icon: "map",      color: "#1B9E8A", label: "Hike & Tour" },
  music:       { icon: "music",    color: "#D44876", label: "Live Music" },
  nightlife:   { icon: "moon",     color: "#7055C8", label: "Nightlife" },
  history:     { icon: "clock",    color: "#1B6EBF", label: "History" },
  sports:      { icon: "activity", color: "#C8A410", label: "Sports" },
  extreme:     { icon: "zap",      color: "#D43A18", label: "Adventure" },
  beach:       { icon: "sun",      color: "#1FB8C4", label: "Beach" },
  spa:         { icon: "heart",    color: "#CF5BA0", label: "Spa" },
  shopping:    { icon: "bag",      color: "#E06822", label: "Shopping" },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? { icon: "star", color: "var(--accent-deep)", label: category };
}

// ---------- Activity card ----------------------------------------------
function ActivityImageHero({ imageurl, title, meta }: { imageurl?: string | null; title: string; meta: { icon: string; color: string; label: string } }) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!imageurl && !imgError;

  return (
    <div style={{ height: 180, overflow: "hidden", position: "relative", background: showImage ? undefined : `linear-gradient(135deg, ${meta.color}22 0%, ${meta.color}44 100%)` }}>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageurl!}
          alt={title}
          loading="lazy"
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
      {!showImage && (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={meta.icon} size={48} stroke={`${meta.color}88`} />
        </div>
      )}
      <span style={{
        position: "absolute", top: 10, left: 10,
        fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
        padding: "3px 10px", borderRadius: 999,
        background: showImage ? `${meta.color}dd` : `${meta.color}cc`, color: "#fff",
      }}>
        {meta.label}
      </span>
    </div>
  );
}

function ActivityCard({ activity, isLast }: { activity: OrchestratorActivity; isLast: boolean }) {
  const [hover, setHover] = useState(false);
  const meta = getCategoryMeta(activity.category);

  return (
    <div style={{ display: "flex", gap: 0, position: "relative" }}>
      {/* Time + timeline */}
      <div style={{ width: 68, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", paddingRight: 16, paddingTop: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>
          {activity.time}
        </span>
        {activity.duration && (
          <span style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{activity.duration}</span>
        )}
      </div>

      {/* Dot + vertical line */}
      <div style={{ width: 24, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
        <div style={{
          width: 12, height: 12, borderRadius: 999, flexShrink: 0,
          background: meta.color, border: `2.5px solid ${meta.color}`,
          boxShadow: `0 0 0 3px ${meta.color}22`,
        }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: "var(--border)", marginTop: 6, minHeight: 40 }} />}
      </div>

      {/* Card */}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          flex: 1, marginLeft: 16, marginBottom: isLast ? 0 : 20,
          background: hover ? "var(--bg-3)" : "var(--bg-2)",
          border: "1px solid var(--border)", borderRadius: "var(--r-l)",
          transition: "all .25s var(--ease)",
          transform: hover ? "translateY(-1px)" : "none",
          boxShadow: hover ? "0 8px 20px rgba(10,27,46,.07)" : "none",
          overflow: "hidden",
        }}
      >
        {/* Image */}
        <ActivityImageHero imageurl={activity.imageurl} title={activity.title} meta={meta} />

        <div style={{ padding: "16px 20px" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={meta.icon} size={14} stroke={meta.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.01em" }}>{activity.title}</span>
                {activity.price && (
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{activity.price}</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <p style={{ margin: "0 0 8px 38px", fontSize: 13, lineHeight: 1.6, color: "var(--text-2)" }}>
              {activity.description}
            </p>
          )}

          {/* Address + tip */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginLeft: 38 }}>
            {activity.address && (
              <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="pin" size={11} stroke="var(--text-3)" />{activity.address}
              </span>
            )}
            {activity.tip && (
              <span style={{
                fontSize: 12, color: "var(--accent-deep)",
                background: "var(--accent-soft)", border: "1px solid var(--accent)",
                padding: "2px 9px", borderRadius: 999,
              }}>
                {activity.tip}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Day view --------------------------------------------------
function DayView({ day, startDate }: { day: OrchestratorDay; startDate: string }) {
  const trueDate = getTrueDate(startDate, (day.day || 1) - 1);
  const activities = day.activities ?? [];
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 4 }}>
          Day {day.day}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>{trueDate}</div>
        {day.title && (
          <div style={{ fontSize: 18, fontWeight: 500, color: "var(--accent-deep)", marginTop: 4 }}>{day.title}</div>
        )}
        {day.summary && (
          <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>{day.summary}</div>
        )}
      </div>
      <div>
        {activities.map((a, i) => (
          <ActivityCard key={`${a.time}-${i}`} activity={a} isLast={i === activities.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ---------- Day tabs --------------------------------------------------
function DayTabs({ days, activeDay, onSelect, startDate }: {
  days: OrchestratorDay[]; activeDay: number; onSelect: (d: number) => void; startDate: string;
}) {
  return (
    <div style={{
      display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
      scrollbarWidth: "none", msOverflowStyle: "none", marginBottom: 40,
    }}>
      {days.map((day) => {
        const active = day.day === activeDay;
        const trueDate = getTrueDate(startDate, (day.day || 1) - 1);
        return (
          <button key={day.day} onClick={() => onSelect(day.day)} style={{
            padding: "10px 18px", borderRadius: "var(--r)", flexShrink: 0,
            background: active ? "var(--ink)" : "var(--bg-2)",
            border: `1px solid ${active ? "var(--ink)" : "var(--border)"}`,
            color: active ? "#fff" : "var(--text-2)",
            cursor: "pointer", fontFamily: "inherit", transition: "all .2s var(--ease)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", opacity: active ? 0.7 : 0.6 }}>
              Day {day.day}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>{trueDate}</div>
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
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px 9px 12px",
      borderRadius: 999, background: hover ? "var(--bg-2)" : "transparent",
      border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 13, fontWeight: 500,
      transition: "background .25s var(--ease)", fontFamily: "inherit", cursor: "pointer",
    }}>
      <Icon name={icon} size={16} />{label}
    </button>
  );
}

function ItineraryTopBar({ answers, dark, onToggle, onRestart }: {
  answers: TripAnswers; dark: boolean; onToggle: () => void; onRestart: () => void;
}) {
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
};

function TripSidebar({ answers, days, activeDay, onSelectDay }: {
  answers: TripAnswers; days: OrchestratorDay[]; activeDay: number; onSelectDay: (d: number) => void;
}) {
  const comp = answers.composition === "couple" ? "Couple" : answers.composition === "solo" ? "Solo" : answers.composition === "family" ? "Family" : "Friends";
  return (
    <aside style={{ borderRight: "1px solid var(--border)", padding: "28px 18px", position: "sticky", top: 78, alignSelf: "flex-start", height: "calc(100vh - 78px)", overflowY: "auto" }}>
      <div style={{ padding: "16px 14px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: 20 }}>
        {answers.userName && (
          <div style={{ fontSize: 13, color: "var(--accent-deep)", fontWeight: 600, marginBottom: 6 }}>
            Hey, {answers.userName} 👋
          </div>
        )}
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.01em", marginBottom: 10 }}>{answers.destination}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="calendar" size={13} stroke="var(--text-3)" />
            {fmtDisplay(answers.dates.start)} – {fmtDisplay(answers.dates.end)}
            <span style={{ color: "var(--text-3)" }}>· {answers.dates.days}d</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="users" size={13} stroke="var(--text-3)" />{comp}
            {answers.travelers.length > 0 && (
              <span style={{ color: "var(--text-3)" }}>· {answers.travelers.map((t) => t.age).filter(Boolean).join(", ")}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="wallet" size={13} stroke="var(--text-3)" />{BUDGET_LABEL[answers.budget] ?? answers.budget}
          </div>
        </div>
      </div>

      {/* Day nav */}
      {days.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Days</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 20 }}>
            {days.map((day) => (
              <button key={day.day} onClick={() => onSelectDay(day.day)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: "var(--r)", background: activeDay === day.day ? "var(--ink)" : "transparent",
                border: `1px solid ${activeDay === day.day ? "var(--ink)" : "transparent"}`,
                color: activeDay === day.day ? "#fff" : "var(--text-2)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                transition: "all .2s var(--ease)", textAlign: "left",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, width: 32, flexShrink: 0 }}>Day {day.day}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                  {getTrueDate(answers.dates.start, (day.day || 1) - 1)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Interests legend */}
      <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Interests</div>
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

// ---------- Revise panel ----------------------------------------------
function RevisePanel({ onSubmit, revising }: { onSubmit: (text: string) => void; revising: boolean }) {
  const [text, setText] = useState("");
  return (
    <div style={{
      marginTop: 54, padding: "32px 36px",
      background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--bg-2) 100%)",
      border: "1px solid var(--accent)", borderRadius: "var(--r-xl)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Icon name="sparkle" size={18} stroke="var(--accent-deep)" />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.01em" }}>Refine your itinerary</span>
      </div>
      <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
        Plain English — &quot;add a beach day&quot;, &quot;more relaxed mornings&quot;, &quot;swap the museum for sunset dinner&quot;.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!revising}
        placeholder="What would you change?"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim() && !revising) onSubmit(text.trim());
        }}
        style={{
          width: "100%", minHeight: 90, padding: "14px 16px", fontSize: 15, lineHeight: 1.5,
          border: "1px solid var(--border)", borderRadius: "var(--r)", outline: "none",
          background: "var(--bg)", color: "var(--text)", resize: "vertical",
          fontFamily: "inherit", boxSizing: "border-box",
          opacity: revising ? 0.5 : 1, transition: "opacity .2s",
        }}
      />
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
        {revising ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent-deep)", fontSize: 14, fontWeight: 500 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)", animation: "pulse 1.2s ease-in-out infinite" }} />
            Replanning your trip…
          </div>
        ) : (
          <>
            <button
              onClick={() => { if (text.trim()) { onSubmit(text.trim()); setText(""); } }}
              disabled={!text.trim()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "12px 22px", borderRadius: 999, fontSize: 14, fontWeight: 600,
                background: text.trim() ? "var(--ink)" : "var(--bg-3)",
                color: text.trim() ? "#fff" : "var(--text-3)",
                border: "none", fontFamily: "inherit",
                cursor: text.trim() ? "pointer" : "default", transition: "all .2s var(--ease)",
              }}
            >
              Re-plan with Breeze <Icon name="sparkle" size={16} />
            </button>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>or ⌘↵</span>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Main screen -----------------------------------------------
interface Props {
  answers: TripAnswers;
  generatedItinerary: GeneratedItinerary;
  onRestart: () => void;
  onUpdate: (itinerary: GeneratedItinerary) => void;
  dark: boolean;
  onToggle: () => void;
}

export default function ItineraryScreen({ answers, generatedItinerary, onRestart, onUpdate, dark, onToggle }: Props) {
  const [revising, setRevising] = useState(false);
  const days = generatedItinerary.days ?? [];
  const [activeDay, setActiveDay] = useState(days[0]?.day ?? 1);
  const currentDay = days.find((d) => d.day === activeDay) ?? days[0];

  const handleRevise = async (feedback: string) => {
    try {
      setRevising(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_data: buildInputData(answers),
          user_rejections: feedback,
          previous_pool: generatedItinerary.pool ?? [],
        }),
      });
      const updated: GeneratedItinerary = await res.json();
      onUpdate(updated);
      setActiveDay(updated.days?.[0]?.day ?? 1);
    } catch {
      // silently revert
    } finally {
      setRevising(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <ItineraryTopBar answers={answers} dark={dark} onToggle={onToggle} onRestart={onRestart} />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", maxWidth: 1440, margin: "0 auto", paddingTop: 78 }}>
        <TripSidebar answers={answers} days={days} activeDay={activeDay} onSelectDay={setActiveDay} />

        <main style={{ padding: "36px 48px 120px", minWidth: 0 }}>
          <div style={{ opacity: revising ? 0.4 : 1, pointerEvents: revising ? "none" : "auto", transition: "opacity .3s var(--ease)" }}>
            {generatedItinerary.message && (
              <div style={{ padding: "12px 16px", background: "var(--accent-soft)", color: "var(--accent-deep)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 14, fontWeight: 500, border: "1px solid var(--accent)" }}>
                {generatedItinerary.message}
              </div>
            )}
            {days.length === 0 ? (
              <div style={{ paddingTop: 80, textAlign: "center", color: "var(--text-3)", fontSize: 15 }}>
                No itinerary generated. Try restarting with different preferences.
              </div>
            ) : (
              <>
                <DayTabs days={days} activeDay={activeDay} onSelect={setActiveDay} startDate={answers.dates.start} />
                {currentDay && <DayView day={currentDay} startDate={answers.dates.start} />}
              </>
            )}
          </div>

          <RevisePanel onSubmit={handleRevise} revising={revising} />
        </main>
      </div>
    </div>
  );
}
