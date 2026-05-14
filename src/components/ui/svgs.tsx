"use client";

// ---------- Wordmark ---------------------------------------------------
export function Wordmark({ size = 28, tag = true }: { size?: number; tag?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
        fontVariationSettings: '"opsz" 24',
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-.02em",
        color: "var(--text)",
      }}
    >
      <span style={{ position: "relative" }}>
        breeze
        <svg
          width={size * 3.4}
          height={size * 0.42}
          viewBox="0 0 200 24"
          style={{
            position: "absolute",
            left: size * 0.05,
            bottom: -size * 0.18,
            width: size * 3.2,
            height: size * 0.42,
            pointerEvents: "none",
          }}
        >
          <path
            d="M 4 12 Q 30 -2, 60 12 T 120 12 T 196 12"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {tag && (
        <span
          style={{
            fontSize: size * 0.4,
            fontWeight: 500,
            color: "var(--text-3)",
            letterSpacing: ".06em",
            fontVariationSettings: '"opsz" 14',
          }}
        >
          .ai
        </span>
      )}
    </span>
  );
}

// ---------- City map background for activity cards --------------------
export function CityMap({
  variant = 0,
  theme = "light",
  style,
}: {
  variant?: number;
  theme?: "light" | "dark";
  style?: React.CSSProperties;
}) {
  const v = variant % 6;
  const isDark = theme === "dark";

  const land = isDark ? "#0E2034" : "#F4EFE2";
  const water = isDark ? "#0E5570" : "#BDE5EA";
  const waterDp = isDark ? "#0A3F55" : "#A8DCE2";
  const road = isDark ? "rgba(255,255,255,.06)" : "rgba(10,27,46,.08)";
  const roadMaj = isDark ? "rgba(255,255,255,.12)" : "rgba(10,27,46,.16)";
  const park = isDark ? "rgba(43,160,90,.18)" : "rgba(180,210,140,.55)";
  const block = isDark ? "rgba(255,255,255,.025)" : "rgba(10,27,46,.025)";
  const pinFill = "var(--accent)";
  const pinHalo = "rgba(31,184,196,.22)";

  const pins: [number, number][] = [
    [62, 44], [38, 56], [70, 36], [44, 38], [58, 60], [48, 50],
  ];
  const [px, py] = pins[v];

  const layouts = [
    <g key="0">
      <path d="M 0 220 C 80 180, 180 220, 320 180 L 400 200 L 400 240 L 0 240 Z" fill={water} />
      <path d="M 250 100 C 260 130, 280 150, 320 160" stroke={waterDp} strokeWidth="14" fill="none" opacity=".5" />
      <ellipse cx="90" cy="60" rx="48" ry="28" fill={park} />
    </g>,
    <g key="1">
      <path d="M 0 0 L 160 0 C 120 40, 80 80, 0 100 Z" fill={water} />
      <ellipse cx="300" cy="180" rx="60" ry="32" fill={park} />
    </g>,
    <g key="2">
      <path d="M 320 0 C 290 60, 310 140, 290 220 L 400 240 L 400 0 Z" fill={water} />
      <path d="M 60 100 Q 100 80, 130 110 T 200 130" stroke={waterDp} strokeWidth="8" fill="none" opacity=".4" />
      <rect x="40" y="160" width="80" height="50" rx="6" fill={park} />
    </g>,
    <g key="3">
      <ellipse cx="240" cy="200" rx="110" ry="40" fill={water} />
      <ellipse cx="80" cy="40" rx="50" ry="22" fill={park} />
    </g>,
    <g key="4">
      <ellipse cx="120" cy="180" rx="55" ry="30" fill={park} />
      <ellipse cx="310" cy="80" rx="45" ry="28" fill={park} />
      <path d="M 0 60 C 60 70, 100 50, 200 60" stroke={waterDp} strokeWidth="10" fill="none" opacity=".4" />
    </g>,
    <g key="5">
      <path d="M -10 80 L 410 200 L 410 240 L -10 240 Z" fill={water} />
      <ellipse cx="100" cy="40" rx="60" ry="20" fill={park} />
    </g>,
  ];

  const horiz = [25, 55, 85, 115, 145, 175].map((y) => y + ((v * 3) % 7));
  const vert = [40, 90, 140, 195, 250, 305, 355].map((x) => x + ((v * 4) % 9));

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" style={style}>
      <rect width="400" height="240" fill={land} />
      {layouts[v]}
      <g opacity=".9">
        {Array.from({ length: 18 }).map((_, i) => (
          <rect
            key={i}
            x={20 + ((i * 41) % 360)}
            y={30 + ((i * 67) % 180)}
            width={18 + ((i * 7) % 24)}
            height={14 + ((i * 5) % 18)}
            fill={block}
            rx="2"
          />
        ))}
      </g>
      <g stroke={road} strokeWidth="1.2" fill="none">
        {horiz.map((y, i) => <line key={"h" + i} x1="0" y1={y} x2="400" y2={y} />)}
        {vert.map((x, i) => <line key={"v" + i} x1={x} y1="0" x2={x} y2="240" />)}
      </g>
      <g stroke={roadMaj} strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path
          d={
            v % 2 === 0
              ? "M 0 90 C 80 92, 160 80, 240 96 S 380 86, 400 92"
              : "M 0 140 C 100 130, 180 150, 280 140 S 380 148, 400 138"
          }
        />
        <path
          d={
            v % 2 === 0
              ? "M 180 0 C 178 60, 200 120, 188 200 S 192 240, 192 240"
              : "M 260 0 C 262 70, 240 130, 258 200 S 254 240, 254 240"
          }
        />
      </g>
      <g transform={`translate(${px * 4} ${py * 2.4})`}>
        <circle r="34" fill={pinHalo} />
        <circle r="22" fill={pinHalo} opacity=".7" />
        <circle r="12" fill={pinFill} stroke="#fff" strokeWidth="3" />
        <circle r="3.5" fill="#fff" />
      </g>
    </svg>
  );
}

// ---------- Weather icons ---------------------------------------------
export function WeatherIcon({ kind = "sun", size = 22 }: { kind?: string; size?: number }) {
  const sun = "#F2B83A";
  const cloud = "var(--text-3)";
  const rain = "var(--accent)";
  switch (kind) {
    case "sun":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.2" fill={sun} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="3" x2="12" y2="5.5" stroke={sun} strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
          ))}
        </svg>
      );
    case "partly":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="9" r="3.5" fill={sun} />
          {[45, 90, 135, 180].map((a) => (
            <line key={a} x1="9" y1="2.5" x2="9" y2="4.5" stroke={sun} strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${a} 9 9)`} />
          ))}
          <path d="M 7 18 a 4 4 0 0 1 0 -8 a 4 4 0 0 1 4 -3 a 4 4 0 0 1 4 3 a 3.5 3.5 0 0 1 3 8 Z" fill="var(--bg-2)" stroke={cloud} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "cloud":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M 5 17 a 4.5 4.5 0 0 1 0 -9 a 5 5 0 0 1 5 -3.5 a 5 5 0 0 1 5 3.5 a 4 4 0 0 1 3.5 9 Z" fill="var(--bg-3)" stroke={cloud} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "rain":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M 5 14 a 4 4 0 0 1 0 -8 a 5 5 0 0 1 5 -3 a 5 5 0 0 1 5 3 a 4 4 0 0 1 3 8 Z" fill="var(--bg-3)" stroke={cloud} strokeWidth="1.6" strokeLinejoin="round" />
          <line x1="8" y1="17" x2="7" y2="21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="17" x2="11" y2="21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="17" x2="15" y2="21" stroke={rain} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

// ---------- Icon library ----------------------------------------------
interface IconProps {
  name: string;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, stroke = "currentColor", strokeWidth = 1.8 }: IconProps) {
  const p = { fill: "none" as const, stroke, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "arrow-right":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 5 12 H 19 M 13 6 L 19 12 L 13 18" {...p} /></svg>;
    case "arrow-left":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 19 12 H 5 M 11 6 L 5 12 L 11 18" {...p} /></svg>;
    case "check":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 5 12 L 10 17 L 19 7" {...p} /></svg>;
    case "plus":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 12 5 V 19 M 5 12 H 19" {...p} /></svg>;
    case "minus":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 5 12 H 19" {...p} /></svg>;
    case "x":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 6 6 L 18 18 M 18 6 L 6 18" {...p} /></svg>;
    case "calendar":
      return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2" {...p} /><path d="M 8 3 V 7 M 16 3 V 7 M 4 11 H 20" {...p} /></svg>;
    case "users":
      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="9" cy="9" r="3" {...p} /><circle cx="17" cy="10" r="2.5" {...p} /><path d="M 3 19 a 6 6 0 0 1 12 0 M 14 19 a 4.5 4.5 0 0 1 7 0" {...p} /></svg>;
    case "wallet":
      return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2" {...p} /><path d="M 3 10 H 21 M 17 15 H 17.01" {...p} /></svg>;
    case "plane":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 3 14 L 11 12 L 14 4 L 16 4 L 14 12 L 21 11 L 21 13 L 14 14 L 16 20 L 14 20 L 11 14 L 3 16 Z" {...p} /></svg>;
    case "share":
      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5" {...p} /><circle cx="6" cy="12" r="2.5" {...p} /><circle cx="18" cy="19" r="2.5" {...p} /><path d="M 8 11 L 16 6 M 8 13 L 16 18" {...p} /></svg>;
    case "download":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 12 4 V 16 M 7 11 L 12 16 L 17 11 M 5 20 H 19" {...p} /></svg>;
    case "moon":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 20 14 A 8 8 0 1 1 10 4 a 6 6 0 0 0 10 10 Z" {...p} /></svg>;
    case "sun":
      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" {...p} /><path d="M 12 2 V 5 M 12 19 V 22 M 2 12 H 5 M 19 12 H 22 M 4.9 4.9 L 6.9 6.9 M 17.1 17.1 L 19.1 19.1 M 4.9 19.1 L 6.9 17.1 M 17.1 6.9 L 19.1 4.9" {...p} /></svg>;
    case "pin":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 12 22 C 12 22, 5 14, 5 9 A 7 7 0 0 1 19 9 C 19 14, 12 22, 12 22 Z" {...p} /><circle cx="12" cy="9" r="2.5" {...p} /></svg>;
    case "clock":
      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path d="M 12 7 V 12 L 15 14" {...p} /></svg>;
    case "edit":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 4 20 H 8 L 19 9 L 15 5 L 4 16 Z M 14 6 L 18 10" {...p} /></svg>;
    case "refresh":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 4 12 a 8 8 0 0 1 14 -5 M 20 4 V 8 H 16 M 20 12 a 8 8 0 0 1 -14 5 M 4 20 V 16 H 8" {...p} /></svg>;
    case "sparkle":
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 12 3 L 13.5 9 L 19.5 10.5 L 13.5 12 L 12 18 L 10.5 12 L 4.5 10.5 L 10.5 9 Z" {...p} /></svg>;
    case "compass":
      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path d="M 16 8 L 13.5 13.5 L 8 16 L 10.5 10.5 Z" {...p} /></svg>;
    default:
      return null;
  }
}
