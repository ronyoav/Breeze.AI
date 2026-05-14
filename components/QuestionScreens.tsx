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
            lineHeight: 1.15,
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

// ---------- Q1: Destination -------------------------------------------
const DESTINATION_TREE: Record<string, Record<string, string[]>> = {
  "Europe": {
    "Italy": ["Rome", "Milan", "Venice", "Florence", "Naples", "Amalfi Coast"],
    "France": ["Paris", "Lyon", "Nice", "Marseille", "Bordeaux"],
    "Spain": ["Barcelona", "Madrid", "Seville", "Valencia", "Ibiza"],
    "UK": ["London", "Edinburgh", "Manchester", "Bath"],
    "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg"],
    "Portugal": ["Lisbon", "Porto", "Faro", "Sintra"],
    "Greece": ["Athens", "Santorini", "Mykonos", "Crete"],
    "Netherlands": ["Amsterdam", "Rotterdam", "Utrecht"],
    "Switzerland": ["Zurich", "Geneva", "Lucerne"],
    "Croatia": ["Dubrovnik", "Split", "Zagreb"],
    "Turkey": ["Istanbul", "Cappadocia", "Antalya"],
    "Iceland": ["Reykjavik"],
    "Poland": ["Warsaw", "Krakow"]
  },
  "Asia": {
    "Japan": ["Tokyo", "Kyoto", "Osaka", "Hokkaido", "Okinawa"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Koh Samui"],
    "Vietnam": ["Hanoi", "Ho Chi Minh City", "Da Nang"],
    "India": ["New Delhi", "Mumbai", "Jaipur", "Goa"],
    "Indonesia": ["Bali", "Jakarta"],
    "South Korea": ["Seoul", "Busan", "Jeju"],
    "Malaysia": ["Kuala Lumpur", "Penang"],
    "Singapore": ["Singapore"],
    "Philippines": ["Manila", "Boracay", "Palawan"],
    "Taiwan": ["Taipei"]
  },
  "North America": {
    "USA": ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas", "San Francisco"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Banff"],
    "Mexico": ["Mexico City", "Cancun", "Tulum", "Oaxaca"]
  },
  "South America": {
    "Brazil": ["Rio de Janeiro", "São Paulo"],
    "Argentina": ["Buenos Aires", "Mendoza", "Patagonia"],
    "Peru": ["Lima", "Cusco", "Machu Picchu"],
    "Colombia": ["Bogota", "Medellin", "Cartagena"],
    "Chile": ["Santiago", "Patagonia"]
  },
  "Africa": {
    "South Africa": ["Cape Town", "Johannesburg"],
    "Morocco": ["Marrakech", "Casablanca", "Fes"],
    "Egypt": ["Cairo", "Luxor", "Giza"],
    "Kenya": ["Nairobi", "Mombasa"],
    "Tanzania": ["Zanzibar", "Serengeti"],
    "Mauritius": ["Port Louis"]
  },
  "Oceania": {
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Gold Coast"],
    "New Zealand": ["Auckland", "Queenstown", "Wellington"],
    "Fiji": ["Nadi", "Suva"]
  }
};

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
  const [selections, setSelections] = useState<string[]>(() => {
    if (!value) return [];
    
    const cities = value.split(",").map(s => s.trim()).filter(Boolean);
    if (cities.length === 0) return [];

    const firstCity = cities[0];
    for (const continent of Object.keys(DESTINATION_TREE)) {
      if (continent === firstCity) return [continent];
      for (const country of Object.keys(DESTINATION_TREE[continent])) {
        if (country === firstCity) return [continent, country];
        if (DESTINATION_TREE[continent][country].includes(firstCity)) {
          return [continent, country, ...cities];
        }
      }
    }
    return [...cities];
  });

  const [customText, setCustomText] = useState("");

  const currentContinent = selections[0];
  const currentCountry = selections[1];
  const currentCities = selections.slice(2);

  let options: string[] = [];
  let placeholder = "";

  if (!currentContinent) {
    options = Object.keys(DESTINATION_TREE);
    placeholder = "Type continent...";
  } else if (!currentCountry) {
    options = DESTINATION_TREE[currentContinent] ? Object.keys(DESTINATION_TREE[currentContinent]) : [];
    placeholder = "Type country...";
  } else {
    options = (DESTINATION_TREE[currentContinent] && DESTINATION_TREE[currentContinent][currentCountry]) 
      ? DESTINATION_TREE[currentContinent][currentCountry] 
      : [];
    placeholder = "Type city...";
  }

  const matches = customText
    ? options.filter((c) => c.toLowerCase().includes(customText.toLowerCase()))
    : options;

  const handleSelect = (opt: string) => {
    if (selections.length >= 2) {
      if (selections.includes(opt)) {
        setSelections(selections.filter(s => s !== opt));
      } else {
        setSelections([...selections, opt]);
      }
    } else {
      setSelections([...selections, opt]);
    }
    setCustomText("");
  };

  const handleRemoveLevel = () => {
    setSelections(selections.slice(0, selections.length - 1));
  };
  
  const handleRemoveCity = (city: string) => {
    setSelections(selections.filter(s => s !== city));
  };

  const submit = () => {
    const finalCities = [...currentCities];
    if (customText.trim() && !finalCities.includes(customText.trim())) {
      finalCities.push(customText.trim());
    }
    if (finalCities.length > 0 || (selections.length >= 2 && customText.trim())) {
      onChange(finalCities.join(", "));
      onAdvance();
    }
  };

  const isNextDisabled = selections.length < 2 || (currentCities.length === 0 && !customText.trim());

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 01"
      title={
        <>
          Where are you <span className="serif">flying to?</span>
        </>
      }
      nextDisabled={isNextDisabled}
      onNext={submit}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      <div style={{ maxWidth: 600 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            width: "100%",
            padding: "16px 26px",
            minHeight: 82,
            border: "1px solid var(--border)",
            background: "var(--bg-2)",
            borderRadius: "var(--r-l)",
          }}
        >
          {currentCities.length > 0 ? (
            currentCities.map((city) => (
              <div
                key={city}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--accent-soft)",
                  color: "var(--accent-deep)",
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                {city}
                <button
                  onClick={() => handleRemoveCity(city)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-deep)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4,
                    borderRadius: 999,
                  }}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))
          ) : selections.length > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--accent-soft)",
                color: "var(--accent-deep)",
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              {selections[selections.length - 1]}
              <button
                onClick={handleRemoveLevel}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-deep)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                  borderRadius: 999,
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ) : null}
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={placeholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (customText.trim() && options.includes(customText.trim())) {
                  handleSelect(customText.trim());
                } else if (customText.trim()) {
                  handleSelect(customText.trim());
                } else if (!isNextDisabled) {
                  submit();
                }
              }
            }}
            style={{
              flex: 1,
              minWidth: 200,
              fontSize: 32,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 48',
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              letterSpacing: "-.02em",
            }}
          />
        </div>
        
        <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {matches.slice(0, 12).map((c) => (
            <SoftBtn key={c} active={currentCities.includes(c)} onClick={() => handleSelect(c)}>
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
  const [start, setStart] = useState(() => {
    try { return new Date(value?.start).toISOString().split('T')[0]; }
    catch { return new Date().toISOString().split('T')[0]; }
  });
  const [end, setEnd] = useState(() => {
    try { return new Date(value?.end).toISOString().split('T')[0]; }
    catch { return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]; }
  });

  const fmt = (dStr: string) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dStr;
    }
  };

  const calcDays = (s: string, e: string) => {
    const sDate = new Date(s);
    const eDate = new Date(e);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return 1;
    const diff = eDate.getTime() - sDate.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)) + 1);
  };

  const submit = () => {
    onChange({ start: fmt(start), end: fmt(end), days: calcDays(start, end) });
    onAdvance();
  };

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 02"
      title={
        <>
          When are you <span className="serif">going?</span>
        </>
      }
      onNext={submit}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, maxWidth: 880, alignItems: "center" }}>
        <div>
          <label style={{ display: "block", color: "var(--text-3)", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Start Date</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ width: "100%", padding: "16px 20px", fontSize: 24, borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "var(--text-3)", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>End Date</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            min={start}
            style={{ width: "100%", padding: "16px 20px", fontSize: 24, borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", outline: "none", fontFamily: "inherit" }}
          />
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 18, color: "var(--text-2)" }}>
        Duration: <strong style={{ color: "var(--accent)", fontSize: 24, padding: "0 6px" }}>{calcDays(start, end)}</strong> days
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
  value: { comp: string | null; ages: string };
  onChange: (v: { comp: string | null; ages: string }) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Composition({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q3Props) {
  const [sel, setSel] = useState<string | null>(value.comp);
  const [ages, setAges] = useState(value.ages);

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
          onChange({ comp: sel, ages });
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
      {sel && (
        <div style={{ marginTop: 32, maxWidth: 880 }}>
          <label style={{ display: "block", color: "var(--text-3)", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Ages of travelers (optional)</label>
          <input
            type="text"
            value={ages}
            onChange={(e) => setAges(e.target.value)}
            placeholder="e.g. 30, 32, 5, 8"
            style={{ width: "100%", padding: "16px 20px", fontSize: 24, borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", outline: "none", fontFamily: "inherit" }}
          />
        </div>
      )}
    </QuestionShell>
  );
}

// ---------- Q4: Budget ----------------------------------------------
const BUDGET_TIERS = [
  { id: "budget", label: "Budget", detail: "Hostels, street food, public transit" },
  { id: "comfort", label: "Comfort", detail: "Boutique stays, good restaurants, taxis" },
  { id: "luxury", label: "Luxury", detail: "5★ hotels, fine dining, private tours" },
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
