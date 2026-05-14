"use client";

import { useState } from "react";
import { TopBar, PrimaryBtn, SoftBtn, IconBtn, Icon } from "./ui";

// ---------- Shared QuestionShell -------------------------------------
interface QuestionShellProps {
  stepIdx: number;
  total: number;
  title: React.ReactNode;
  kicker: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  dark: boolean;
  onToggle: () => void;
}

function QuestionShell({
  stepIdx,
  total,
  title,
  kicker,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  dark,
  onToggle,
}: QuestionShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "120px 60px 40px",
        position: "relative",
      }}
    >
      <TopBar dark={dark} onToggle={onToggle} step={stepIdx} total={total} onBack={onBack} />

      {/* progress bar */}
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
            width: `${((stepIdx + 1) / total) * 100}%`,
            background: "linear-gradient(90deg, var(--accent), var(--lemon))",
            transition: "width .5s var(--ease)",
          }}
        />
      </div>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
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
          {kicker}
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
          {title}
        </h2>

        <div style={{ marginTop: 54 }}>{children}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 54 }}>
          <PrimaryBtn onClick={onNext} disabled={nextDisabled} large>
            {nextLabel}
            <Icon name="arrow-right" size={20} />
          </PrimaryBtn>
          <span style={{ color: "var(--text-3)", fontSize: 13 }}>
            or press{" "}
            <kbd
              style={{
                padding: "2px 8px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontFamily: "inherit",
                fontSize: 12,
              }}
            >
              Enter
            </kbd>
          </span>
        </div>
      </main>
    </div>
  );
}

// ---------- Q1: Departure -------------------------------------------
const POPULAR_DEPARTURES = ["Tel Aviv", "London", "Paris", "Berlin", "New York", "Madrid", "Rome", "Amsterdam"];

interface Q1Props {
  value: string;
  onChange: (v: string) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Departure({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q1Props) {
  const [text, setText] = useState(value || "");
  const matches = text
    ? POPULAR_DEPARTURES.filter((c) => c.toLowerCase().includes(text.toLowerCase()))
    : POPULAR_DEPARTURES;

  const submit = () => {
    if (text.trim()) {
      onChange(text.trim());
      onAdvance();
    }
  };

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 01"
      title={
        <>
          Where did you <span className="serif">fly in from?</span>
        </>
      }
      nextDisabled={!text.trim()}
      onNext={submit}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      <div style={{ maxWidth: 680 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your home city…"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          style={{
            width: "100%",
            padding: "22px 26px",
            fontSize: 32,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 48',
            border: "1px solid var(--border)",
            background: "var(--bg-2)",
            borderRadius: "var(--r-l)",
            outline: "none",
            color: "var(--text)",
            letterSpacing: "-.02em",
          }}
        />
        <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {matches.slice(0, 8).map((c) => (
            <SoftBtn key={c} active={text === c} onClick={() => setText(c)}>
              {c}
            </SoftBtn>
          ))}
        </div>
      </div>
    </QuestionShell>
  );
}

// ---------- Q2: Dates -----------------------------------------------
interface DatesValue {
  start: string;
  end: string;
  days: number;
}

interface Q2Props {
  value: DatesValue;
  onChange: (v: DatesValue) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Dates({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q2Props) {
  const [days, setDays] = useState(value?.days || 7);
  const startDate = new Date(2026, 5, 10);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days - 1);

  const submit = () => {
    onChange({ start: fmt(startDate), end: fmt(endDate), days });
    onAdvance();
  };

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 02"
      title={
        <>
          How long are you <span className="serif">staying?</span>
        </>
      }
      onNext={submit}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, maxWidth: 880, alignItems: "center" }}>
        <div
          style={{
            padding: "32px 36px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-l)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span
              style={{
                fontSize: 88,
                fontWeight: 600,
                color: "var(--accent)",
                lineHeight: 0.85,
                letterSpacing: "-.03em",
                fontVariationSettings: '"opsz" 96',
              }}
            >
              {days}
            </span>
            <span style={{ fontSize: 24, color: "var(--text-2)" }}>day{days !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <IconBtn onClick={() => setDays(Math.max(1, days - 1))} label="-1 day">
              <Icon name="minus" size={18} />
            </IconBtn>
            <IconBtn onClick={() => setDays(Math.min(30, days + 1))} label="+1 day">
              <Icon name="plus" size={18} />
            </IconBtn>
            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              {[3, 5, 7, 10, 14].map((n) => (
                <SoftBtn key={n} active={days === n} onClick={() => setDays(n)}>
                  {n}
                </SoftBtn>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              color: "var(--text-3)",
              fontSize: 13,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Your dates
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.02em" }}>{fmt(startDate)}</div>
            <span style={{ color: "var(--text-3)" }}>→</span>
            <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.02em" }}>{fmt(endDate)}</div>
          </div>
          <div style={{ marginTop: 8, color: "var(--text-3)", fontSize: 14 }}>2026</div>
        </div>
      </div>
    </QuestionShell>
  );
}

// ---------- Q3: Composition -----------------------------------------
const COMP_OPTIONS = [
  { id: "solo", label: "Solo", sub: "Just me", n: 1 },
  { id: "couple", label: "Couple", sub: "Two travelers", n: 2 },
  { id: "family", label: "Family", sub: "With kids", n: 4 },
  { id: "friends", label: "Friends", sub: "Group trip", n: 3 },
];

function CompositionGlyph({ n, active }: { n: number; active: boolean }) {
  const c = active ? "var(--accent)" : "var(--text-2)";
  return (
    <svg width="44" height="32" viewBox="0 0 44 32" fill="none">
      {Array.from({ length: n }).map((_, i) => {
        const offset = (i - (n - 1) / 2) * 11;
        return <circle key={i} cx={22 + offset} cy={16} r={6} fill={c} opacity={i === 0 ? 1 : 0.55} />;
      })}
    </svg>
  );
}

interface Q3Props {
  value: string | null;
  onChange: (v: string) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Composition({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q3Props) {
  const [sel, setSel] = useState<string | null>(value || null);

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 03"
      title={
        <>
          Who are you <span className="serif">traveling with?</span>
        </>
      }
      nextDisabled={!sel}
      onNext={() => {
        if (sel) {
          onChange(sel);
          onAdvance();
        }
      }}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, maxWidth: 880 }}>
        {COMP_OPTIONS.map((o) => {
          const active = sel === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setSel(o.id)}
              style={{
                textAlign: "left",
                padding: "28px 24px 22px",
                background: active ? "var(--accent-soft)" : "var(--bg-2)",
                border: "1px solid",
                borderColor: active ? "var(--accent)" : "var(--border)",
                borderRadius: "var(--r-l)",
                transition: "all .25s var(--ease)",
                transform: active ? "translateY(-2px)" : "none",
                boxShadow: active ? "0 12px 24px rgba(31,184,196,.15)" : "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 30,
                }}
              >
                <CompositionGlyph n={o.n} active={active} />
                {active && <Icon name="check" size={18} stroke="var(--accent-deep)" />}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.01em" }}>{o.label}</div>
              <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>{o.sub}</div>
            </button>
          );
        })}
      </div>
    </QuestionShell>
  );
}

// ---------- Q4: Budget ----------------------------------------------
const BUDGET_TIERS = [
  { id: "budget", label: "Budget", range: "€40 – 100 / day", detail: "Hostels, street food, public transit" },
  { id: "comfort", label: "Comfort", range: "€100 – 250 / day", detail: "Boutique stays, good restaurants, taxis" },
  { id: "luxury", label: "Luxury", range: "€250+ / day", detail: "5★ hotels, fine dining, private tours" },
];

interface Q4Props {
  value: string;
  onChange: (v: string) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Budget({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q4Props) {
  const [sel, setSel] = useState(value || "comfort");

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 04 · last one"
      title={
        <>
          What&apos;s your <span className="serif">daily budget?</span>
        </>
      }
      onNext={() => {
        onChange(sel);
        onAdvance();
      }}
      nextLabel="Set your interests"
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      <div style={{ display: "grid", gap: 10, maxWidth: 780 }}>
        {BUDGET_TIERS.map((t) => {
          const active = sel === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSel(t.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: 24,
                padding: "24px 28px",
                textAlign: "left",
                background: active ? "var(--accent-soft)" : "var(--bg-2)",
                border: "1px solid",
                borderColor: active ? "var(--accent)" : "var(--border)",
                borderRadius: "var(--r-l)",
                cursor: "pointer",
                transition: "all .25s var(--ease)",
                transform: active ? "translateX(4px)" : "none",
                fontFamily: "inherit",
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>{t.label}</div>
                <div style={{ color: "var(--text-3)", fontSize: 14, marginTop: 4 }}>{t.detail}</div>
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: active ? "var(--accent-deep)" : "var(--text-2)",
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 14',
                }}
              >
                {t.range}
              </div>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  border: "2px solid",
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? "var(--accent)" : "transparent",
                }}
              >
                {active && <div style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} />}
              </div>
            </button>
          );
        })}
      </div>
    </QuestionShell>
  );
}
