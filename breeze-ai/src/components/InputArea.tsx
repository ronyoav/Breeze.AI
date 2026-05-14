import React, { useState } from "react";
import type { Step } from "../types";
import "./InputArea.css";

interface Props {
  step: Step;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

// ─── Drilldown sub-component ────────────────────────────────────────────────

type DrillLevel = "continent" | "country" | "city";

interface DrillState {
  level: DrillLevel;
  continent: string | null;
  country: string | null;
}

function DrilldownInput({
  step,
  onSubmit,
  disabled,
}: {
  step: Step;
  onSubmit: (v: string) => void;
  disabled?: boolean;
}) {
  const data = step.drilldown!;
  const [drill, setDrill] = useState<DrillState>({
    level: "continent",
    continent: null,
    country: null,
  });
  const [text, setText] = useState("");

  const continents = Object.keys(data);
  const countries = drill.continent ? Object.keys(data[drill.continent]) : [];
  const cities =
    drill.continent && drill.country
      ? data[drill.continent][drill.country]
      : [];

  // what the user has "committed" at each level
  const currentSelection =
    drill.level === "continent"
      ? drill.continent
      : drill.level === "country"
      ? drill.country
      : null;

  const handleContinent = (c: string) => {
    setDrill({ level: "country", continent: c, country: null });
    setText("");
  };
  const handleCountry = (c: string) => {
    setDrill((prev) => ({ ...prev, level: "city", country: c }));
    setText("");
  };
  const handleCity = (city: string) => {
    onSubmit(city);
  };
  const goBack = () => {
    if (drill.level === "city")
      setDrill((prev) => ({ ...prev, level: "country", country: null }));
    else if (drill.level === "country")
      setDrill({ level: "continent", continent: null, country: null });
    setText("");
  };

  const handleTextSubmit = () => {
    const v = text.trim();
    if (v) onSubmit(v);
  };
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleTextSubmit();
  };

  // confirm button: submit whatever drill level is selected without going deeper
  const confirmLabel =
    drill.level === "country" && drill.continent
      ? `Anywhere in ${drill.continent}`
      : drill.level === "city" && drill.country
      ? `Anywhere in ${drill.country}`
      : null;

  return (
    <div className={`input-area ${disabled ? "input-disabled" : ""}`}>
      {/* Breadcrumb */}
      {drill.level !== "continent" && (
        <div className="breadcrumb">
          <button className="back-btn" onClick={goBack} type="button">
            ← Back
          </button>
          <span className="breadcrumb-path">
            {drill.continent}
            {drill.country ? ` › ${drill.country}` : ""}
          </span>
        </div>
      )}

      {/* Chips for current level */}
      <div className="chips-container">
        {confirmLabel && (
          <div className="chips">
            <button
              className="chip chip-confirm"
              onClick={() =>
                onSubmit(
                  drill.level === "city" ? drill.country! : drill.continent!
                )
              }
              type="button"
            >
              ✓ {confirmLabel}
            </button>
          </div>
        )}

        <div className="chips">
          {drill.level === "continent" &&
            continents.map((c) => (
              <button
                key={c}
                className="chip"
                onClick={() => handleContinent(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          {drill.level === "country" &&
            countries.map((c) => (
              <button
                key={c}
                className="chip"
                onClick={() => handleCountry(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          {drill.level === "city" &&
            cities.map((city) => (
              <button
                key={city}
                className="chip"
                onClick={() => handleCity(city)}
                type="button"
              >
                {city}
              </button>
            ))}
        </div>
      </div>

      {/* Free-text fallback */}
      <div className="input-row">
        <input
          type="text"
          className="text-input"
          placeholder={step.placeholder ?? "Or type a destination…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
        />
        <button
          className="send-btn"
          onClick={handleTextSubmit}
          disabled={disabled || !text.trim()}
          type="button"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Date dropdown sub-component ────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear + 1, currentYear + 2];

function DateDropdownInput({
  onSubmit,
  disabled,
}: {
  step: Step;
  onSubmit: (v: string) => void;
  disabled?: boolean;
}) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const allSelected = day && month && year;

  const handleSubmit = () => {
    if (!allSelected) return;
    onSubmit(`${day} ${month} ${year}`);
  };

  return (
    <div className={`input-area ${disabled ? "input-disabled" : ""}`}>
      <div className="date-dropdowns">
        <select
          className="date-select"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          disabled={disabled}
        >
          <option value="">Day</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          className="date-select date-select--month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={disabled}
        >
          <option value="">Month</option>
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select
          className="date-select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          disabled={disabled}
        >
          <option value="">Year</option>
          {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>

      <div className="input-row">
        <div className="compound-preview">
          {allSelected ? (
            <span className="compound-preview-value">{day} {month} {year}</span>
          ) : (
            <span className="compound-preview-placeholder">Select day, month and year</span>
          )}
        </div>
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={disabled || !allSelected}
          type="button"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Compound chips sub-component ───────────────────────────────────────────

function CompoundChipsInput({
  step,
  onSubmit,
  disabled,
}: {
  step: Step;
  onSubmit: (v: string) => void;
  disabled?: boolean;
}) {
  const groups = step.compoundGroups!;
  const [selections, setSelections] = useState<(string | null)[]>(
    groups.map(() => null)
  );

  const toggle = (groupIdx: number, chip: string) => {
    setSelections((prev) =>
      prev.map((s, i) => (i === groupIdx ? (s === chip ? null : chip) : s))
    );
  };

  const allSelected = selections.every((s) => s !== null);
  const preview = allSelected ? selections.join(" ") : null;

  const handleSubmit = () => {
    if (!allSelected) return;
    onSubmit(selections.join(" "));
  };

  return (
    <div className={`input-area ${disabled ? "input-disabled" : ""}`}>
      <div className="compound-groups">
        {groups.map((group, gi) => (
          <div key={gi} className="chips">
            {group.chips.map((chip) => (
              <button
                key={chip}
                className={`chip ${selections[gi] === chip ? "chip-selected" : ""}`}
                onClick={() => toggle(gi, chip)}
                disabled={disabled}
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="input-row">
        <div className="compound-preview">
          {preview ? (
            <span className="compound-preview-value">{preview}</span>
          ) : (
            <span className="compound-preview-placeholder">
              Pick a number and a unit
            </span>
          )}
        </div>
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={disabled || !allSelected}
          type="button"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Standard chips/date input ───────────────────────────────────────────────

function StandardInput({
  step,
  onSubmit,
  disabled,
}: {
  step: Step;
  onSubmit: (v: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const toggleChip = (chip: string) => {
    if (disabled) return;
    if (step.multiSelect) {
      setSelectedChips((prev) =>
        prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
      );
    } else {
      setSelectedChips((prev) => (prev[0] === chip ? [] : [chip]));
    }
    setText("");
  };

  const handleSubmit = () => {
    if (disabled) return;
    const value =
      selectedChips.length > 0 ? selectedChips.join(", ") : text.trim();
    if (!value) return;
    const finalValue =
      step.id === "budget"
        ? (value.replace(/\s*[💸💳💎]/u, "").trim().toLowerCase() as "low" | "medium" | "high")
        : value;
    onSubmit(finalValue);
    setText("");
    setSelectedChips([]);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const hasSelection = selectedChips.length > 0 || text.trim().length > 0;

  const renderChips = (chips: string[]) =>
    chips.map((chip) => (
      <button
        key={chip}
        className={`chip ${selectedChips.includes(chip) ? "chip-selected" : ""}`}
        onClick={() => toggleChip(chip)}
        disabled={disabled}
        type="button"
      >
        {chip}
      </button>
    ));

  return (
    <div className={`input-area ${disabled ? "input-disabled" : ""}`}>
      {step.inputType === "chips" && (
        <div className="chips-container">
          {step.chipGroups
            ? step.chipGroups.map((group) => (
                <div key={group.label} className="chip-group">
                  <span className="chip-group-label">{group.label}</span>
                  <div className="chips">{renderChips(group.chips)}</div>
                </div>
              ))
            : step.chips && <div className="chips">{renderChips(step.chips)}</div>}
        </div>
      )}

      {step.multiSelect && selectedChips.length > 0 && (
        <div className="multiselect-summary">
          <span>Selected: </span>
          <strong>{selectedChips.join(", ")}</strong>
        </div>
      )}

      <div className="input-row">
        {step.inputType === "date" ? (
          <input
            type="date"
            className="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
            min={new Date().toISOString().split("T")[0]}
          />
        ) : (
          <input
            type="text"
            className="text-input"
            placeholder={
              selectedChips.length > 0
                ? step.multiSelect
                  ? "Add more or press send…"
                  : selectedChips[0]
                : (step.placeholder ?? "Or type your answer…")
            }
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!step.multiSelect) setSelectedChips([]);
            }}
            onKeyDown={handleKey}
            disabled={disabled}
          />
        )}
        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={disabled || !hasSelection}
          type="button"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Shared icon ─────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export const InputArea: React.FC<Props> = ({ step, onSubmit, disabled }) => {
  if (step.inputType === "drilldown")
    return <DrilldownInput step={step} onSubmit={onSubmit} disabled={disabled} />;
  if (step.inputType === "compound-chips")
    return <CompoundChipsInput step={step} onSubmit={onSubmit} disabled={disabled} />;
  if (step.inputType === "date")
    return <DateDropdownInput step={step} onSubmit={onSubmit} disabled={disabled} />;
  return <StandardInput step={step} onSubmit={onSubmit} disabled={disabled} />;
};
