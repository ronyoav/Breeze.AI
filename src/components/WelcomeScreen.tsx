"use client";

import { TopBar, PrimaryBtn, Icon } from "./ui";
import { WeatherIcon } from "./ui/svgs";

interface Props {
  onStart: () => void;
  dark: boolean;
  onToggle: () => void;
}

export default function WelcomeScreen({ onStart, dark, onToggle }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "120px 60px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <TopBar dark={dark} onToggle={onToggle} />

      {/* ambient blobs */}
      <div
        style={{
          position: "absolute",
          right: -200,
          top: -200,
          width: 700,
          height: 700,
          background: "radial-gradient(closest-side, var(--accent-soft), transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -180,
          bottom: -220,
          width: 600,
          height: 600,
          background: "radial-gradient(closest-side, rgba(245,224,74,.18), transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "var(--display)",
            lineHeight: 1.05,
            fontWeight: 500,
            letterSpacing: "-.04em",
            fontVariationSettings: '"opsz" 96',
          }}
        >
          Plan your
          <br />
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>next trip</span>
          <span
            className="serif"
            style={{ fontSize: ".55em", color: "var(--text-3)", marginLeft: ".15em", verticalAlign: "baseline" }}
          >
            .
          </span>
        </h1>

        <p
          style={{
            maxWidth: 600,
            marginTop: 32,
            fontSize: 22,
            lineHeight: 1.45,
            color: "var(--text-2)",
            fontWeight: 400,
          }}
        >
          We&apos;ll ask four quick questions, then build an itinerary tuned to{" "}
          <span className="serif" style={{ fontSize: "1.05em", color: "var(--text)" }}>
            what you actually want to do
          </span>{" "}
          — not just what&apos;s popular.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 54 }}>
          <PrimaryBtn onClick={onStart} large>
            Start planning
            <Icon name="arrow-right" size={20} />
          </PrimaryBtn>
        </div>

        <div
          style={{
            marginTop: 120,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 24,
            color: "var(--text-3)",
            fontSize: 12,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          <div></div>
          <div>v 0.1 &nbsp;·&nbsp; preview</div>
        </div>
      </main>
    </div>
  );
}
