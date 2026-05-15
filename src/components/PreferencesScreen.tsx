"use client";

import { useState } from "react";
import { TopBar, PrimaryBtn, Icon } from "./ui";

const INTEREST_OPTIONS = [
  { id: "restaurants", label: "Restaurants", sub: "Local food, hidden tascas" },
  { id: "nightlife", label: "Nightlife", sub: "Bars, clubs, late vibes" },
  { id: "history", label: "History", sub: "Sites, monuments, old town" },
  { id: "sports", label: "Sports", sub: "Watch a match, play, run" },
  { id: "extreme", label: "Extreme", sub: "Surf, dive, jump" },
  { id: "treks", label: "Treks", sub: "Trails, day hikes" },
  { id: "beach", label: "Beach & Resorts", sub: "Sand, sun, sea" },
  { id: "spa", label: "Spa & Wellness", sub: "Slow mornings, hammam" },
  { id: "music", label: "Music & Festivals", sub: "Concerts, fado, DJs" },
  { id: "shopping", label: "Shopping", sub: "Markets, boutiques, design" },
];

function InterestCard({
  option,
  active,
  onClick,
}: {
  option: (typeof INTEREST_OPTIONS)[0];
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: "left",
        padding: "22px",
        position: "relative",
        background: active ? "var(--accent)" : "var(--bg-2)",
        color: active ? "#fff" : "var(--text)",
        border: "1px solid",
        borderColor: active ? "var(--accent)" : "var(--border)",
        borderRadius: "var(--r-l)",
        cursor: "pointer",
        transition: "all .3s var(--ease)",
        transform: active ? "translateY(-4px)" : hover ? "translateY(-2px)" : "none",
        boxShadow: active
          ? "0 16px 32px rgba(31,184,196,.25)"
          : hover
          ? "0 6px 16px rgba(10,27,46,.08)"
          : "none",
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 18,
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          border: active ? "2px solid #fff" : "2px solid var(--border)",
          background: active ? "rgba(255,255,255,.15)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {active && <Icon name="check" size={16} stroke="#fff" />}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.01em" }}>{option.label}</div>
        <div
          style={{
            fontSize: 12,
            marginTop: 4,
            lineHeight: 1.4,
            color: active ? "rgba(255,255,255,.78)" : "var(--text-3)",
          }}
        >
          {option.sub}
        </div>
      </div>
    </button>
  );
}

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  onAdvance: () => void;
  onBack: () => void;
  dark: boolean;
  onToggle: () => void;
}

export default function PreferencesScreen({ value, onChange, onAdvance, onBack, dark, onToggle }: Props) {
  const [sel, setSel] = useState(new Set(value.filter((v) => INTEREST_OPTIONS.some((o) => o.id === v))));
  // Custom "Other" free-text interests
  const [customInterests, setCustomInterests] = useState<string[]>(
    () => value.filter((v) => !INTEREST_OPTIONS.some((o) => o.id === v))
  );
  const [showOther, setShowOther] = useState(() =>
    value.some((v) => !INTEREST_OPTIONS.some((o) => o.id === v))
  );

  const buildFinalList = (newSel: Set<string>, newCustom: string[]) => {
    const presets = Array.from(newSel);
    const customs = newCustom.filter((c) => c.trim());
    return [...presets, ...customs];
  };

  const toggle = (id: string) => {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    setSel(next);
    onChange(buildFinalList(next, customInterests));
  };

  const toggleOther = () => {
    const next = !showOther;
    setShowOther(next);
    if (!next) {
      setCustomInterests([]);
      onChange(buildFinalList(sel, []));
    } else if (customInterests.length === 0) {
      setCustomInterests([""]);
    }
  };

  const updateCustom = (i: number, val: string) => {
    const next = [...customInterests];
    next[i] = val;
    // Auto-add a new empty field when user starts typing in the last one
    if (i === next.length - 1 && val.trim()) next.push("");
    setCustomInterests(next);
    onChange(buildFinalList(sel, next));
  };

  const removeCustom = (i: number) => {
    const next = customInterests.filter((_, idx) => idx !== i);
    if (next.length === 0) next.push("");
    setCustomInterests(next);
    onChange(buildFinalList(sel, next));
  };

  const count = sel.size + customInterests.filter((c) => c.trim()).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "110px 60px 40px",
        position: "relative",
      }}
    >
      <TopBar dark={dark} onToggle={onToggle} onBack={onBack} />

      {/* progress bar — full */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 60,
          background: "var(--border)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            background: "linear-gradient(90deg, var(--accent), var(--lemon))",
          }}
        />
      </div>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 48,
            alignItems: "end",
            marginBottom: 48,
          }}
        >
          <div>
            <div
              style={{
                marginBottom: 14,
                color: "var(--accent-deep)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              Last step · your interests
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--h1)",
                lineHeight: 0.95,
                fontWeight: 500,
                letterSpacing: "-.03em",
                maxWidth: "14ch",
                fontVariationSettings: '"opsz" 64',
              }}
            >
              What do you <span className="serif">love</span> on a trip?
            </h2>
          </div>
          <p
            style={{
              margin: 0,
              color: "var(--text-2)",
              fontSize: 18,
              lineHeight: 1.55,
              maxWidth: "46ch",
            }}
          >
            Pick anything that excites you — three or four is plenty. We&apos;ll weight your itinerary toward these and
            lean away from the rest.
          </p>
        </div>

        {/* Preset interest grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {INTEREST_OPTIONS.map((o) => (
            <InterestCard key={o.id} option={o} active={sel.has(o.id)} onClick={() => toggle(o.id)} />
          ))}

          {/* "Other" card */}
          <InterestCard
            option={{ id: "other", label: "Other", sub: "Your own interests — type below" }}
            active={showOther}
            onClick={toggleOther}
          />
        </div>

        {/* Other free-text inputs */}
        {showOther && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-deep)", letterSpacing: ".06em", textTransform: "uppercase" }}>
              Describe your interests
            </div>
            {customInterests.map((val, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={val}
                  onChange={(e) => updateCustom(i, e.target.value)}
                  placeholder={i === 0 ? "e.g. Photography, Architecture, Street art…" : "Add another…"}
                  autoFocus={i === 0 && !val}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    fontSize: 16,
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-l)",
                    outline: "none",
                    color: "var(--text)",
                    fontFamily: "inherit",
                  }}
                />
                {customInterests.length > 1 && (
                  <button
                    onClick={() => removeCustom(i)}
                    style={{
                      background: "transparent", border: "1px solid var(--border)",
                      borderRadius: "var(--r)", padding: "10px", cursor: "pointer",
                      display: "flex", alignItems: "center", color: "var(--text-3)",
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ color: "var(--text-3)", fontSize: 14 }}>
            <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 18, marginRight: 6 }}>{count}</span>
            selected
          </div>
          <PrimaryBtn onClick={onAdvance} disabled={count === 0} large>
            Build my trip
            <Icon name="sparkle" size={20} />
          </PrimaryBtn>
        </div>
      </main>
    </div>
  );
}
