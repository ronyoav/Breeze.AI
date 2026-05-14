"use client";

import { useState, useEffect } from "react";
import { IconBtn, Icon, Wordmark } from "./ui";
import { CityMap } from "./ui/svgs";
import type { TripAnswers, ItineraryDay, ActivitySlot, DayBlock } from "./types";
import type { Concert } from "@/app/api/concerts/route";

// ---------- Static itinerary data -----------------------------------
const ITINERARY: ItineraryDay[] = [
  {
    day: 1, weekday: "Tuesday", date: "Jun 10",
    area: "Alfama · Chiado", subtitle: "Arrival & old town",
    cost: 180,
    blocks: [
      { time: "morning", slots: [
        { time: "10:00", duration: "1h", title: "Check-in · Hotel da Baixa", desc: "Quiet boutique on Rua dos Fanqueiros. 10-min walk from Praça do Comércio.", tag: "Stay", source: "Booking", map: 0, area: "Baixa" },
        { time: "11:30", duration: "45 min", title: "Pastéis de Belém", desc: "The original 1837 bakery. Skip the indoor queue, take a few to go.", tag: "Bite", source: "Google", map: 1, area: "Belém" },
      ]},
      { time: "afternoon", slots: [
        { time: "14:30", duration: "1.5h", title: "Jerónimos Monastery", desc: "Manueline architecture, intricate cloisters. Pre-book entry.", tag: "History", source: "Foursquare", map: 2, area: "Belém" },
        { time: "16:30", duration: "1h", title: "Tram 28 · Alfama loop", desc: "Board at Martim Moniz, ride the historic line through old town.", tag: "Walk", source: "Google", map: 3, area: "Alfama" },
      ]},
      { time: "evening", slots: [
        { time: "19:30", duration: "2h", title: "Taberna da Rua das Flores", desc: "No-reservation tasca in Chiado. Arrive by 19:00 for a table.", tag: "Dinner", source: "OpenTable", map: 4, area: "Chiado" },
      ]},
    ],
  },
  {
    day: 2, weekday: "Wednesday", date: "Jun 11",
    area: "Bairro Alto · Príncipe Real", subtitle: "Slow food & viewpoints",
    cost: 215,
    blocks: [
      { time: "morning", slots: [
        { time: "09:30", duration: "1h", title: "Time Out Market", desc: "Start with a bica and a fresh pastel — the breakfast counter at the back.", tag: "Bite", source: "Foursquare", map: 5, area: "Cais do Sodré" },
        { time: "11:00", duration: "2h", title: "LX Factory", desc: "Old industrial complex turned design district. Ler Devagar bookshop is a must.", tag: "Walk", source: "Google", map: 0, area: "Alcântara" },
      ]},
      { time: "afternoon", slots: [
        { time: "14:30", duration: "1.5h", title: "Miradouro de São Pedro de Alcântara", desc: "Best panoramic view of central Lisbon. Bring a coffee.", tag: "Viewpoint", source: "Foursquare", map: 1, area: "Bairro Alto" },
        { time: "17:00", duration: "1.5h", title: "Embaixada concept mall", desc: "19th-century Arabian-revival palace, now hosts indie boutiques.", tag: "Shopping", source: "Google", map: 2, area: "Príncipe Real" },
      ]},
      { time: "evening", slots: [
        { time: "20:00", duration: "3h", title: "Fado at Mesa de Frades", desc: "Tiny 12-table room in a 18th-century tile chapel. Reserve a week ahead.", tag: "Music", source: "Mesa de Frades", map: 3, area: "Alfama" },
      ]},
    ],
  },
  {
    day: 3, weekday: "Thursday", date: "Jun 12",
    area: "Sintra (day trip)", subtitle: "Castles in the mist",
    cost: 95,
    blocks: [
      { time: "morning", slots: [
        { time: "08:30", duration: "40 min", title: "Train · Rossio → Sintra", desc: "Catch the 08:36 from Rossio station. Cheaper than driving, faster than the bus.", tag: "Transit", source: "CP Trains", map: 5, area: "Lisboa" },
        { time: "10:00", duration: "2.5h", title: "Pena Palace", desc: "The yellow-and-red fairytale palace. Go early; queues swell after 11:30.", tag: "History", source: "Foursquare", map: 0, area: "Sintra" },
      ]},
      { time: "afternoon", slots: [
        { time: "13:30", duration: "1h", title: "Lunch at Tascantiga", desc: "Tapas in Sintra old town. The bacalhau croquettes are worth the wait.", tag: "Lunch", source: "OpenTable", map: 1, area: "Sintra" },
        { time: "15:00", duration: "2h", title: "Quinta da Regaleira", desc: "Esoteric gardens and the famous inverted Initiation Well.", tag: "History", source: "Google", map: 2, area: "Sintra" },
      ]},
      { time: "evening", slots: [
        { time: "19:30", duration: "2h", title: "Cervejaria Ramiro", desc: "Back in Lisbon. Seafood beer hall — get the giant prawns and Coca-Cola.", tag: "Dinner", source: "Google", map: 4, area: "Anjos" },
      ]},
    ],
  },
  {
    day: 4, weekday: "Friday", date: "Jun 13",
    area: "Cascais coast", subtitle: "Sea air & oysters",
    cost: 140,
    blocks: [
      { time: "morning", slots: [
        { time: "10:00", duration: "1h", title: "Coastal train · Cais → Cascais", desc: "Take the slow line along the Tagus estuary. Sit on the right.", tag: "Transit", source: "CP", map: 2, area: "Coast" },
        { time: "11:30", duration: "2h", title: "Boca do Inferno walk", desc: "Dramatic cliffs and crashing surf. Easy 30-min walk from the town.", tag: "Walk", source: "Foursquare", map: 3, area: "Cascais" },
      ]},
      { time: "afternoon", slots: [
        { time: "14:00", duration: "2h", title: "Mar do Inferno", desc: "Grilled fish on the rocks, ocean spray included. Get the dourada.", tag: "Lunch", source: "OpenTable", map: 4, area: "Cascais" },
      ]},
      { time: "evening", slots: [
        { time: "19:00", duration: "2h", title: "Sunset at Praia do Guincho", desc: "Wide windswept beach. Surfers in the water, sunset behind them.", tag: "Beach", source: "Google", map: 5, area: "Guincho" },
      ]},
    ],
  },
  {
    day: 5, weekday: "Saturday", date: "Jun 14",
    area: "Belém · MAAT", subtitle: "Slow art day",
    cost: 110,
    blocks: [
      { time: "morning", slots: [
        { time: "10:00", duration: "2h", title: "MAAT museum", desc: "Architecture + art on the riverfront. Walk the wave-shaped roof.", tag: "Art", source: "Foursquare", map: 0, area: "Belém" },
      ]},
      { time: "afternoon", slots: [
        { time: "13:00", duration: "1.5h", title: "Lunch at Darwin's Café", desc: "Light Mediterranean menu, river views, easy pace.", tag: "Lunch", source: "OpenTable", map: 1, area: "Belém" },
        { time: "15:00", duration: "2h", title: "Belém Tower + walk", desc: "Postcard tower, then walk back along the river to the city.", tag: "History", source: "Google", map: 2, area: "Belém" },
      ]},
      { time: "evening", slots: [
        { time: "20:30", duration: "2h", title: "Park Bar · sunset DJ set", desc: "Rooftop bar atop a parking garage. Reserve a table or arrive early.", tag: "Music", source: "Foursquare", map: 3, area: "Bairro Alto" },
      ]},
    ],
  },
  {
    day: 6, weekday: "Sunday", date: "Jun 15",
    area: "Alfama · Feira da Ladra", subtitle: "Markets & fado",
    cost: 95,
    blocks: [
      { time: "morning", slots: [
        { time: "09:00", duration: "2h", title: "Feira da Ladra flea market", desc: "Sunday-only market. Vintage azulejo tiles, books, ceramics.", tag: "Shopping", source: "Google", map: 4, area: "Graça" },
      ]},
      { time: "afternoon", slots: [
        { time: "12:30", duration: "1.5h", title: "Lunch at Zé da Mouraria", desc: "Old-school tasca. Order the bacalhau à Brás and split it.", tag: "Lunch", source: "Foursquare", map: 5, area: "Mouraria" },
        { time: "15:00", duration: "2h", title: "Museu do Azulejo", desc: "Five centuries of Portuguese tiles inside a cloister convent.", tag: "Art", source: "Google", map: 0, area: "Xabregas" },
      ]},
      { time: "evening", slots: [
        { time: "20:00", duration: "3h", title: "Clube de Fado", desc: "A bigger, more polished fado house — easier to book, still moving.", tag: "Music", source: "OpenTable", map: 1, area: "Alfama" },
      ]},
    ],
  },
  {
    day: 7, weekday: "Monday", date: "Jun 16",
    area: "Bairro Alto · departure", subtitle: "Slow last day",
    cost: 60,
    blocks: [
      { time: "morning", slots: [
        { time: "10:00", duration: "1.5h", title: "Coffee + pastel at Manteigaria", desc: "Many say it's better than Belém. Eat one warm at the counter.", tag: "Bite", source: "Foursquare", map: 2, area: "Chiado" },
        { time: "12:00", duration: "1h", title: "Last walk · Príncipe Real", desc: "Quiet leafy square, design boutiques, secret garden cafés.", tag: "Walk", source: "Google", map: 3, area: "Príncipe Real" },
      ]},
      { time: "afternoon", slots: [
        { time: "15:00", duration: "30 min", title: "Taxi to LIS airport", desc: "Budget €18–22, 25 minutes outside rush hour.", tag: "Transit", source: "Bolt", map: 4, area: "Airport" },
      ]},
      { time: "evening", slots: [] },
    ],
  },
];

// ---------- Sub-components ------------------------------------------
function SmallActionBtn({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px 9px 12px",
        borderRadius: 999,
        background: hover ? "var(--bg-2)" : "transparent",
        border: "1px solid var(--border)",
        color: "var(--text-2)",
        fontSize: 13,
        fontWeight: 500,
        transition: "background .25s var(--ease)",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

function ItineraryTopBar({
  answers,
  dark,
  onToggle,
  onRestart,
}: {
  answers: TripAnswers;
  dark: boolean;
  onToggle: () => void;
  onRestart: () => void;
}) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        padding: "14px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Wordmark size={22} />
        <span style={{ width: 1, height: 24, background: "var(--border)" }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.01em" }}>
            {answers.destination} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>·</span> {answers.dates.days} days
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{answers.dates.start} – {answers.dates.end}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SmallActionBtn icon="refresh" label="Regenerate" onClick={onRestart} />
        <SmallActionBtn icon="download" label="Export PDF" />
        <SmallActionBtn icon="share" label="Share" />
        <IconBtn onClick={onToggle} label={dark ? "light" : "dark"}>
          <Icon name={dark ? "sun" : "moon"} size={18} />
        </IconBtn>
      </div>
    </header>
  );
}

function DayPill({ d, active, onClick }: { d: ItineraryDay; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 12px",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "#fff" : "var(--text)",
        borderRadius: "var(--r)",
        textAlign: "left",
        border: "1px solid",
        borderColor: active ? "var(--ink)" : "transparent",
        transition: "all .25s var(--ease)",
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-s)",
          background: active ? "var(--accent)" : "var(--accent-soft)",
          color: active ? "#fff" : "var(--accent-deep)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          flex: "0 0 36px",
        }}
      >
        0{d.day}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-.005em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {d.area}
        </div>
        <div
          style={{
            fontSize: 11,
            color: active ? "rgba(255,255,255,.7)" : "var(--text-3)",
            marginTop: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {d.date}
        </div>
      </div>
    </button>
  );
}

function DaySidebar({
  days,
  active,
  onSelect,
  totalCost,
  budgetCap,
}: {
  days: ItineraryDay[];
  active: number;
  onSelect: (d: number) => void;
  totalCost: number;
  budgetCap: number;
}) {
  const pct = Math.min(100, (totalCost / budgetCap) * 100);
  return (
    <aside
      style={{
        borderRight: "1px solid var(--border)",
        padding: "36px 22px",
        position: "sticky",
        top: 78,
        alignSelf: "flex-start",
        height: "calc(100vh - 78px)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          letterSpacing: ".15em",
          textTransform: "uppercase",
          marginBottom: 14,
          fontWeight: 600,
        }}
      >
        Itinerary
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {days.map((d) => (
          <DayPill key={d.day} d={d} active={d.day === active} onClick={() => onSelect(d.day)} />
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "24px 0 18px" }} />

      <div style={{ padding: "4px 4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              letterSpacing: ".15em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Budget
          </span>
          <Icon name="wallet" size={14} stroke="var(--text-3)" />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>€{totalCost}</span>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>/ €{budgetCap}</span>
        </div>
        <div
          style={{
            height: 6,
            background: "var(--bg-3)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: pct > 90 ? "var(--lemon)" : "var(--accent)",
              transition: "width .4s var(--ease)",
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-3)" }}>per person · estimated</div>
      </div>
    </aside>
  );
}



function DayHeader({ d }: { d: ItineraryDay }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 24,
        paddingBottom: 24,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 14,
              color: "var(--accent-deep)",
              fontWeight: 600,
              letterSpacing: ".15em",
              textTransform: "uppercase",
            }}
          >
            Day {String(d.day).padStart(2, "0")}
          </span>
          <span style={{ color: "var(--text-3)", fontSize: 14 }}>·</span>
          <span style={{ color: "var(--text-2)", fontSize: 14 }}>
            {d.weekday}, {d.date}
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--h2)",
            fontWeight: 500,
            letterSpacing: "-.03em",
            fontVariationSettings: '"opsz" 48',
          }}
        >
          <span className="serif" style={{ color: "var(--text)", fontSize: "1em" }}>
            {d.subtitle}
          </span>
          <span style={{ color: "var(--text-3)", fontWeight: 400, marginLeft: 14 }}>·</span>
          <span style={{ color: "var(--text-2)", fontWeight: 500, marginLeft: 14 }}>{d.area}</span>
        </h1>
      </div>
    </div>
  );
}

function BudgetDayBar({ cost, cap }: { cost: number; cap: number }) {
  const pct = Math.min(100, (cost / cap) * 100);
  return (
    <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        Day est.
      </div>
      <div
        style={{
          flex: "0 0 220px",
          height: 4,
          background: "var(--bg-3)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)" }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        €{cost}
        <span style={{ color: "var(--text-3)", fontWeight: 400, marginLeft: 6 }}>/ €{cap} per person</span>
      </div>
    </div>
  );
}

function ActivityCard({ slot, dayIdx, idx }: { slot: ActivitySlot; dayIdx: number; idx: number }) {
  const [hover, setHover] = useState(false);
  const mapVariant = (slot.map ?? (dayIdx * 3 + idx)) % 6;
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "260px 1fr auto",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-l)",
        overflow: "hidden",
        transition: "all .3s var(--ease)",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 14px 28px rgba(10,27,46,.08)" : "none",
      }}
    >
      {/* Map panel */}
      <div style={{ position: "relative", minHeight: 160 }}>
        <CityMap variant={mapVariant} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--bg-2)",
            color: "var(--text)",
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".02em",
          }}
        >
          <Icon name="pin" size={12} stroke="var(--accent-deep)" />
          {slot.area}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "22px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              border: "1px solid var(--accent)",
            }}
          >
            {slot.tag}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              letterSpacing: ".05em",
              textTransform: "uppercase",
            }}
          >
            via {slot.source}
          </span>
        </div>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-.015em",
            fontVariationSettings: '"opsz" 24',
          }}
        >
          {slot.title}
        </h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-2)", maxWidth: "54ch" }}>
          {slot.desc}
        </p>
      </div>

      {/* Time / actions */}
      <div
        style={{
          padding: "22px 26px",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "space-between",
          minWidth: 140,
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-.01em",
              fontVariationSettings: '"opsz" 24',
            }}
          >
            {slot.time}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 5,
              justifyContent: "flex-end",
            }}
          >
            <Icon name="clock" size={11} />
            {slot.duration}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 18,
            opacity: hover ? 1 : 0.65,
            transition: "opacity .25s var(--ease)",
          }}
        >
          <IconBtn label="edit" style={{ width: 34, height: 34 }}>
            <Icon name="edit" size={14} />
          </IconBtn>
          <IconBtn label="swap" style={{ width: 34, height: 34 }}>
            <Icon name="refresh" size={14} />
          </IconBtn>
        </div>
      </div>
    </article>
  );
}

function BlockSection({ block, dayIdx }: { block: DayBlock; dayIdx: number }) {
  if (!block.slots || block.slots.length === 0) return null;
  return (
    <section style={{ marginTop: 42 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent-deep)",
            letterSpacing: ".25em",
            textTransform: "uppercase",
          }}
        >
          {block.time}
        </div>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {block.slots.map((s, i) => (
          <ActivityCard key={i} slot={s} dayIdx={dayIdx} idx={i} />
        ))}
      </div>
    </section>
  );
}

function DarkBtn({
  children,
  primary = false,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "11px 18px",
        borderRadius: 999,
        background: primary ? "var(--lemon)" : hover ? "rgba(255,255,255,.1)" : "transparent",
        color: primary ? "var(--ink)" : "#fff",
        border: primary ? "1px solid var(--lemon)" : "1px solid rgba(255,255,255,.2)",
        fontSize: 13,
        fontWeight: 600,
        transition: "all .25s var(--ease)",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function FeedbackBar({ day, onOpen }: { day: ItineraryDay; onOpen: () => void }) {
  return (
    <div
      style={{
        marginTop: 54,
        padding: "24px 28px",
        background: "var(--ink)",
        color: "#fff",
        borderRadius: "var(--r-xl)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}>
          Love it, or want changes?
        </div>
        <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginTop: 4 }}>
          Tell us in plain English — we&apos;ll re-plan the right slice.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <DarkBtn>Regenerate Day {day.day}</DarkBtn>
        <DarkBtn>Edit a moment</DarkBtn>
        <DarkBtn primary onClick={onOpen}>
          <Icon name="sparkle" size={16} />
          Ask Breeze to fix
        </DarkBtn>
      </div>
    </div>
  );
}

function FeedbackOverlay({ onClose, day }: { onClose: () => void; day: ItineraryDay }) {
  const [text, setText] = useState("");
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(5,15,25,.55)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          background: "var(--bg-2)",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border)",
          maxWidth: 600,
          width: "100%",
          padding: "36px 36px 28px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--bg-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Icon name="x" size={16} />
        </button>
        <div
          style={{
            color: "var(--accent-deep)",
            fontSize: 12,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Day {day.day} · {day.area}
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 500, letterSpacing: "-.02em" }}>
          What would <span className="serif">make this better?</span>
        </h2>
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: 14, lineHeight: 1.5 }}>
          Plain English works. Try things like &quot;less walking&quot;, &quot;more seafood&quot;, &quot;swap the
          museum for a beach day&quot;.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I'd swap the monastery for a long lunch with a view…"
          style={{
            marginTop: 20,
            width: "100%",
            minHeight: 120,
            padding: "14px 16px",
            fontSize: 15,
            lineHeight: 1.5,
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            outline: "none",
            background: "var(--bg)",
            color: "var(--text)",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "11px 18px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-2)",
              fontFamily: "inherit",
              cursor: "pointer",
              background: "transparent",
              border: "none",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 22px",
              background: "var(--ink)",
              color: "#fff",
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Re-plan with this <Icon name="sparkle" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Date helper ---------------------------------------------
function parseTripDate(label: string): string {
  // label is like "Jun 10" — resolve to YYYY-MM-DD using current or next year
  const now = new Date();
  const attempt = new Date(`${label} ${now.getFullYear()}`);
  if (!isNaN(attempt.getTime())) {
    if (attempt < now) attempt.setFullYear(now.getFullYear() + 1);
    return attempt.toISOString().split("T")[0];
  }
  return now.toISOString().split("T")[0];
}

// ---------- ConcertsPanel -------------------------------------------
function ConcertCard({ c }: { c: Concert }) {
  const [hover, setHover] = useState(false);
  const dateLabel = (() => {
    try {
      return new Date(c.date).toLocaleDateString("en-US", {
        month: "short", day: "numeric", weekday: "short",
      });
    } catch { return c.date; }
  })();

  return (
    <a
      href={c.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        gap: 0,
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-l)",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "all .3s var(--ease)",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 14px 28px rgba(10,27,46,.08)" : "none",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 120,
          flexShrink: 0,
          background: c.image ? `url(${c.image}) center/cover` : "var(--accent-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!c.image && <Icon name="music" size={28} stroke="var(--accent-deep)" />}
      </div>

      {/* Info */}
      <div style={{ padding: "18px 20px", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              border: "1px solid var(--accent)",
            }}
          >
            {c.source}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{dateLabel}</span>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 4,
          }}
        >
          {c.name}
        </div>
        {c.venue && (
          <div
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon name="pin" size={11} stroke="var(--text-3)" />
            {c.venue}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div
        style={{
          padding: "18px 16px",
          display: "flex",
          alignItems: "center",
          color: "var(--text-3)",
          opacity: hover ? 1 : 0.4,
          transition: "opacity .25s var(--ease)",
        }}
      >
        <Icon name="chevron-right" size={16} />
      </div>
    </a>
  );
}

function ConcertsPanel({ answers }: { answers: TripAnswers }) {
  const [concerts, setConcerts] = useState<Concert[] | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "empty" | "error">("loading");

  useEffect(() => {
    if (!answers.destination) return;
    const start = parseTripDate(answers.dates.start);
    const end = parseTripDate(answers.dates.end);
    const params = new URLSearchParams({ city: answers.destination, startDate: start, endDate: end });

    fetch(`/api/concerts?${params}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 404 || !data.concerts?.length) {
          setStatus("empty");
        } else {
          setConcerts(data.concerts);
          setStatus("found");
        }
      })
      .catch(() => setStatus("error"));
  }, [answers.destination, answers.dates.start, answers.dates.end]);

  return (
    <div style={{ marginTop: 56 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent-deep)",
            letterSpacing: ".25em",
            textTransform: "uppercase",
          }}
        >
          Live concerts
        </div>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
          {answers.destination} · {answers.dates.start} – {answers.dates.end}
        </span>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "var(--text-3)",
            fontSize: 14,
          }}
        >
          Searching for concerts…
        </div>
      )}

      {/* Found */}
      {status === "found" && concerts && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {concerts.map((c) => (
            <ConcertCard key={c.id} c={c} />
          ))}
        </div>
      )}

      {/* 404 – nothing found */}
      {(status === "empty" || status === "error") && (
        <div
          style={{
            padding: "48px 32px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-l)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--bg-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name="music" size={22} stroke="var(--text-3)" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No concerts found</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>
            No live music events in {answers.destination} for those dates via Ticketmaster or
            Eventbrite.
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main ItineraryScreen ------------------------------------
interface Props {
  answers: TripAnswers;
  onRestart: () => void;
  dark: boolean;
  onToggle: () => void;
}

export default function ItineraryScreen({ answers, onRestart, dark, onToggle }: Props) {
  const [day, setDay] = useState(1);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const current = ITINERARY.find((d) => d.day === day)!;
  const totalCost = ITINERARY.reduce((sum, d) => sum + d.cost, 0);
  const budgetCap = answers.budget === "budget" ? 100 : answers.budget === "luxury" ? 400 : 220;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <ItineraryTopBar answers={answers} dark={dark} onToggle={onToggle} onRestart={onRestart} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          maxWidth: 1440,
          margin: "0 auto",
          paddingTop: 78,
        }}
      >
        <DaySidebar
          days={ITINERARY}
          active={day}
          onSelect={setDay}
          totalCost={totalCost}
          budgetCap={budgetCap * 7}
        />

        <main style={{ padding: "36px 48px 120px", minWidth: 0 }}>
          <DayHeader d={current} />
          <BudgetDayBar cost={current.cost} cap={budgetCap} />
          <div style={{ marginTop: 32 }}>
            {current.blocks.map((b, i) => (
              <BlockSection key={i} block={b} dayIdx={current.day} />
            ))}
          </div>
          <ConcertsPanel answers={answers} />
          <FeedbackBar day={current} onOpen={() => setFeedbackOpen(true)} />
        </main>
      </div>

      {feedbackOpen && <FeedbackOverlay onClose={() => setFeedbackOpen(false)} day={current} />}
    </div>
  );
}
