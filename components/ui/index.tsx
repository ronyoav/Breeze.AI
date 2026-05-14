"use client";

import { useState } from "react";
import { Icon, Wordmark } from "./svgs";

export { Icon, Wordmark } from "./svgs";
export { WeatherIcon, CityMap } from "./svgs";

// ---------- TopBar ---------------------------------------------------
interface TopBarProps {
  dark: boolean;
  onToggle: () => void;
  step?: number;
  total?: number;
  onBack?: () => void;
}

export function TopBar({ dark, onToggle, step, total, onBack }: TopBarProps) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 40px",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, pointerEvents: "auto" }}>
        <Wordmark size={26} />
        {step != null && total != null && (
          <span
            style={{
              marginLeft: 14,
              color: "var(--text-3)",
              fontSize: 12,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              fontVariationSettings: '"opsz" 14',
            }}
          >
            <span style={{ color: "var(--text)" }}>0{step + 1}</span>
            &nbsp;/&nbsp;0{total}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
        {onBack && (
          <IconBtn onClick={onBack} label="back">
            <Icon name="arrow-left" size={18} />
          </IconBtn>
        )}
        <IconBtn onClick={onToggle} label={dark ? "light mode" : "dark mode"}>
          <Icon name={dark ? "sun" : "moon"} size={18} />
        </IconBtn>
      </div>
    </header>
  );
}

// ---------- IconBtn --------------------------------------------------
interface IconBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  primary?: boolean;
  style?: React.CSSProperties;
}

export function IconBtn({ children, onClick, label, primary = false, style }: IconBtnProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 42,
        height: 42,
        borderRadius: 999,
        background: primary ? "var(--accent)" : "var(--bg-2)",
        color: primary ? "#fff" : "var(--text)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .25s var(--ease), background .25s var(--ease)",
        transform: hover ? "translateY(-1px)" : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ---------- PrimaryBtn -----------------------------------------------
interface PrimaryBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  large?: boolean;
  style?: React.CSSProperties;
}

export function PrimaryBtn({ children, onClick, disabled = false, large = false, style }: PrimaryBtnProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: large ? "20px 32px" : "14px 22px",
        background: "var(--ink)",
        color: "#fff",
        borderRadius: 999,
        fontSize: large ? 18 : 15,
        fontWeight: 600,
        letterSpacing: "-.005em",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform .3s var(--ease), box-shadow .3s var(--ease)",
        transform: !disabled && hover ? "translateY(-2px)" : "none",
        boxShadow: !disabled && hover ? "0 12px 30px rgba(10,27,46,.25)" : "0 6px 16px rgba(10,27,46,.12)",
        border: "none",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ---------- SoftBtn --------------------------------------------------
interface SoftBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export function SoftBtn({ children, onClick, active = false }: SoftBtnProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent-deep)" : "var(--text-2)",
        border: "1px solid",
        borderColor: active ? "var(--accent)" : "var(--border)",
        fontSize: 13,
        fontWeight: 500,
        transition: "all .25s var(--ease)",
        transform: hover && !active ? "translateY(-1px)" : "none",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
