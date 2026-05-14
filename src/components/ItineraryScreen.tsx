"use client";

import { useState } from "react";
import { IconBtn, Icon, Wordmark } from "./ui";
import type { TripAnswers, AttractionItem, ItineraryData } from "./types";

// ---------- Date display helper ------------------------------------
function fmtDisplay(d: string): string {
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------- Shared UI helpers -------------------------------------
function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-deep)", letterSpacing: ".25em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      {sub && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</span>}
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{ padding: "48px 32px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r-l)", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <Icon name={icon} size={22} stroke="var(--text-3)" />
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>{body}</div>
    </div>
  );
}

// ---------- Generic attraction card --------------------------------
function AttractionCard({ item, accent = false }: { item: AttractionItem; accent?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={item.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "20px 22px",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-l)",
        textDecoration: "none",
        color: "inherit",
        transition: "all .3s var(--ease)",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 14px 28px rgba(10,27,46,.08)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.01em", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.name}
          </div>
          {/* Restaurant extras */}
          {(item.cuisine || item.priceRange) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              {item.cuisine && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{item.cuisine}</span>}
              {item.priceRange && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-deep)", background: "var(--accent-soft)", border: "1px solid var(--accent)", padding: "1px 7px", borderRadius: 999 }}>
                  {item.priceRange}
                </span>
              )}
            </div>
          )}
          {/* Concert extras */}
          {(item.date || item.venue || item.source) && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
              {item.source && (
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent-deep)", border: "1px solid var(--accent)" }}>
                  {item.source}
                </span>
              )}
              {item.date && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{fmtDisplay(item.date)}</span>}
              {item.venue && (
                <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="pin" size={10} stroke="var(--text-3)" />{item.venue}
                </span>
              )}
            </div>
          )}
        </div>
        {item.image && (
          <div style={{ width: 56, height: 56, borderRadius: "var(--r-s)", background: `url(${item.image}) center/cover`, flexShrink: 0 }} />
        )}
      </div>

      {item.description && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--text-2)" }}>
          {item.description}
        </p>
      )}

      {(item.address || item.tip) && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {item.address && (
            <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="pin" size={11} stroke="var(--text-3)" />{item.address}
            </span>
          )}
          {item.tip && (
            <span style={{ fontSize: 12, color: accent ? "var(--accent-deep)" : "var(--text-3)", background: accent ? "var(--accent-soft)" : "transparent", padding: accent ? "2px 8px" : "0", borderRadius: 999, border: accent ? "1px solid var(--accent)" : "none" }}>
              {item.tip}
            </span>
          )}
        </div>
      )}
    </a>
  );
}

// ---------- Category section ---------------------------------------
const INTEREST_META: Record<string, { label: string; icon: string; accentTip?: boolean }> = {
  restaurants: { label: "Restaurants", icon: "utensils" },
  treks:       { label: "Hikes & Tours", icon: "map", accentTip: true },
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

function InterestSection({
  interest,
  items,
  sub,
}: {
  interest: string;
  items: AttractionItem[];
  sub?: string;
}) {
  const meta = INTEREST_META[interest] ?? { label: interest, icon: "star" };

  return (
    <section style={{ marginTop: 56 }}>
      <SectionHeader label={meta.label} sub={sub} />
      {items.length === 0 ? (
        <EmptyState icon={meta.icon} title={`No ${meta.label.toLowerCase()} found`} body={`Nothing returned for this category.`} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {items.map((item) => (
            <AttractionCard key={item.id} item={item} accent={meta.accentTip} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------- Top bar ------------------------------------------------
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

// ---------- Sidebar ------------------------------------------------
const BUDGET_LABEL: Record<string, string> = { budget: "Budget", comfort: "Comfort", luxury: "Luxury" };

function TripSidebar({ answers }: { answers: TripAnswers }) {
  const comp = answers.composition === "couple" ? "Couple" : answers.composition === "solo" ? "Solo" : answers.composition === "family" ? "Family" : "Friends";
  return (
    <aside style={{ borderRight: "1px solid var(--border)", padding: "36px 22px", position: "sticky", top: 78, alignSelf: "flex-start", height: "calc(100vh - 78px)", overflowY: "auto" }}>
      <div style={{ padding: "18px 16px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.01em", marginBottom: 12 }}>{answers.destination}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="calendar" size={13} stroke="var(--text-3)" />
            {fmtDisplay(answers.dates.start)} – {fmtDisplay(answers.dates.end)}
            <span style={{ color: "var(--text-3)" }}>· {answers.dates.days}d</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="users" size={13} stroke="var(--text-3)" />{comp}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <Icon name="wallet" size={13} stroke="var(--text-3)" />{BUDGET_LABEL[answers.budget] ?? answers.budget}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
        Your interests
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {answers.interests.map((id) => {
          const meta = INTEREST_META[id];
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", background: "var(--bg-2)", border: "1px solid var(--border)", fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
              <Icon name={meta?.icon ?? "star"} size={14} stroke="var(--accent-deep)" />
              {meta?.label ?? id}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ---------- Feedback bar -------------------------------------------
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

// ---------- Main screen --------------------------------------------
interface Props {
  answers: TripAnswers;
  itineraryData: ItineraryData;
  onRestart: () => void;
  dark: boolean;
  onToggle: () => void;
}

export default function ItineraryScreen({ answers, itineraryData, onRestart, dark, onToggle }: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const interests = answers.interests ?? [];

  // Concert date context for section sub-label
  const concertSub = `${fmtDisplay(answers.dates.start)} – ${fmtDisplay(answers.dates.end)}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <ItineraryTopBar answers={answers} dark={dark} onToggle={onToggle} onRestart={onRestart} />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", maxWidth: 1440, margin: "0 auto", paddingTop: 78 }}>
        <TripSidebar answers={answers} />

        <main style={{ padding: "36px 48px 120px", minWidth: 0 }}>
          {interests.length === 0 && (
            <div style={{ paddingTop: 80, textAlign: "center", color: "var(--text-3)", fontSize: 15 }}>
              No interests selected. Go back and pick what you love.
            </div>
          )}

          {interests.map((interest) => {
            const items = itineraryData[interest] ?? [];
            const sub =
              interest === "music" ? concertSub :
              interest === "restaurants" ? (BUDGET_LABEL[answers.budget] ?? answers.budget) :
              undefined;
            return (
              <InterestSection key={interest} interest={interest} items={items} sub={sub} />
            );
          })}

          <FeedbackBar onOpen={() => setFeedbackOpen(true)} />
        </main>
      </div>

      {feedbackOpen && <FeedbackOverlay onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
