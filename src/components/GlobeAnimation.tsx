"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export function GlobeAnimation({ location, dark }: { location?: [number, number]; dark: boolean }) {
  const globeRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (location) {
      controls.autoRotate = false;
      globeRef.current.pointOfView({ lat: location[0], lng: location[1], altitude: 1.5 }, 1200);
    } else {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.5;
    }
  }, [location]);

  if (!isClient) return <div style={{ width: 600, height: 600, maxWidth: "100%" }} />;

  const globeImageUrl = dark 
    ? "//unpkg.com/three-globe/example/img/earth-dark.jpg"
    : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  const markers = location ? [{ lat: location[0], lng: location[1], size: 20 }] : [];

  return (
    <div style={{ width: 600, height: 600, maxWidth: "100%", cursor: "grab", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Globe
        ref={globeRef}
        width={600}
        height={600}
        globeImageUrl={globeImageUrl}
        backgroundColor="rgba(0,0,0,0)"
        htmlElementsData={markers}
        htmlElement={() => {
          const el = document.createElement("div");
          el.innerHTML = `
            <div style="
              width: 16px; 
              height: 16px; 
              background: var(--accent); 
              border: 2px solid white;
              border-radius: 50%; 
              box-shadow: 0 0 15px var(--accent);
              transform: translate(-50%, -50%);
              animation: pulse 2s infinite;
            "></div>
            <style>
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(31, 184, 196, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(31, 184, 196, 0); }
                100% { box-shadow: 0 0 0 0 rgba(31, 184, 196, 0); }
              }
            </style>
          `;
          return el;
        }}
        onGlobeReady={() => {
          if (globeRef.current) {
            globeRef.current.controls().enableZoom = false;
            if (!location) {
              globeRef.current.controls().autoRotate = true;
              globeRef.current.controls().autoRotateSpeed = 1.5;
            } else {
              globeRef.current.pointOfView({ lat: location[0], lng: location[1], altitude: 1.5 }, 0);
            }
          }
        }}
      />
    </div>
  );
}
