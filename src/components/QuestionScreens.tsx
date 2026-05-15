"use client";

import { useState, useEffect } from "react";
import { TopBar, PrimaryBtn, SoftBtn, IconBtn, Icon } from "./ui";
import { GlobeAnimation } from "./GlobeAnimation";
import type { Traveler } from "./types";

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
  sideElement?: React.ReactNode;
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
  sideElement,
}: QuestionShellProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !nextDisabled) {
        const activeTag = document.activeElement?.tagName.toUpperCase();
        // Ignore if focused on an input/textarea, as they handle their own Enter events
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
        
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, nextDisabled]);

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
          alignItems: "center",
          gap: 60,
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
        </div>

        {sideElement && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {sideElement}
          </div>
        )}
      </main>
    </div>
  );
}

// ---------- Q0: Name --------------------------------------------------
interface Q0Props {
  value: string;
  onChange: (v: string) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Name({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q0Props) {
  const [name, setName] = useState(value || "");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange(trimmed);
    onAdvance();
  };

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 01"
      title={<>What&apos;s your <span className="serif">name?</span></>}
      nextDisabled={!name.trim()}
      onNext={submit}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      <div style={{ maxWidth: 480 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) submit(); }}
          placeholder="e.g. Alex"
          autoFocus
          style={{
            width: "100%", padding: "18px 24px", fontSize: 28, fontWeight: 500,
            letterSpacing: "-.02em", background: "var(--bg-2)",
            border: "1px solid var(--border)", borderRadius: "var(--r-l)",
            outline: "none", color: "var(--text)", fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--text-3)" }}>
          We&apos;ll use your name to personalise your itinerary
        </p>
      </div>
    </QuestionShell>
  );
}

// ---------- Q1: Destination -------------------------------------------
const KNOWN_CITIES = [
  "Rome","Milan","Venice","Florence","Naples","Amalfi Coast","Paris","Lyon","Nice","Marseille",
  "Bordeaux","Barcelona","Madrid","Seville","Valencia","Ibiza","London","Edinburgh","Manchester",
  "Bath","Berlin","Munich","Frankfurt","Hamburg","Lisbon","Porto","Faro","Sintra","Athens",
  "Santorini","Mykonos","Crete","Amsterdam","Rotterdam","Utrecht","Zurich","Geneva","Lucerne",
  "Dubrovnik","Split","Zagreb","Istanbul","Cappadocia","Antalya","Reykjavik","Warsaw","Krakow",
  "Tokyo","Kyoto","Osaka","Hokkaido","Okinawa","Bangkok","Chiang Mai","Phuket","Koh Samui",
  "Hanoi","Ho Chi Minh City","Da Nang","New Delhi","Mumbai","Jaipur","Goa","Bali","Jakarta",
  "Seoul","Busan","Jeju","Kuala Lumpur","Penang","Manila","Boracay","Palawan","Taipei",
  "New York","Los Angeles","Chicago","Miami","Las Vegas","San Francisco","Toronto","Vancouver",
  "Montreal","Banff","Mexico City","Cancun","Tulum","Oaxaca","Rio de Janeiro","São Paulo",
  "Buenos Aires","Mendoza","Lima","Cusco","Machu Picchu","Bogota","Medellin","Cartagena",
  "Santiago","Cape Town","Johannesburg","Marrakech","Casablanca","Fes","Cairo","Luxor","Giza",
  "Nairobi","Mombasa","Zanzibar","Sydney","Melbourne","Brisbane","Gold Coast","Auckland",
  "Queenstown","Wellington","Tel Aviv","Jerusalem","Dubai","Abu Dhabi","Doha","Riyadh",
  "Muscat","Beirut","Amman","Petra","Tbilisi","Baku","Yerevan","Prague","Vienna","Budapest",
  "Bratislava","Krakow","Gdansk","Tallinn","Riga","Vilnius","Helsinki","Stockholm","Oslo",
  "Copenhagen","Brussels","Bruges","Luxembourg","Valletta","Nicosia","Thessaloniki","Heraklion",
  "Palermo","Naples","Bologna","Turin","Genoa","Verona","Pisa","Sorrento","Positano",
  "Cannes","Strasbourg","Toulouse","Nantes","Rennes","Bilbao","Malaga","Granada","Cordoba",
  "Palma","Tenerife","Las Palmas","Porto","Braga","Lagos","Algarve","Funchal","Accra",
  "Lagos","Dakar","Abidjan","Addis Ababa","Dar es Salaam","Kampala","Kigali","Windhoek",
  "Casablanca","Tunis","Algiers","Tripoli","Khartoum","Colombo","Kathmandu","Dhaka",
  "Karachi","Lahore","Islamabad","Tashkent","Almaty","Astana","Ulaanbaatar","Phnom Penh",
  "Vientiane","Yangon","Naypyidaw","Colombo","Male","Thimphu","Dili","Port Moresby",
  "Suva","Apia","Nuku'alofa","Honiara","Lima","Bogota","Quito","La Paz","Montevideo",
  "Asuncion","Georgetown","Paramaribo","Cayenne","Havana","San Jose","Guatemala City",
  "Panama City","Managua","Tegucigalpa","San Salvador","Belize City","Nassau","Bridgetown",
  "Port of Spain","Kingston","Santo Domingo","San Juan","Monterrey","Guadalajara","Puebla",
];


const COORDINATE_MAP: Record<string, [number, number]> = {
  // Continents
  "Europe": [54.5260, 15.2551],
  "Asia": [34.0479, 100.6197],
  "North America": [54.5260, -105.2551],
  "South America": [-8.7832, -55.4915],
  "Africa": [-8.7832, 34.5085],
  "Oceania": [-25.2744, 133.7751],
  // Countries
  "Italy": [41.8719, 12.5674],
  "France": [46.2276, 2.2137],
  "Spain": [40.4637, -3.7492],
  "UK": [55.3781, -3.4360],
  "Germany": [51.1657, 10.4515],
  "Portugal": [39.3999, -8.2245],
  "Greece": [39.0742, 21.8243],
  "Netherlands": [52.1326, 5.2913],
  "Switzerland": [46.8182, 8.2275],
  "Croatia": [45.1000, 15.2000],
  "Turkey": [38.9637, 35.2433],
  "Iceland": [64.9631, -19.0208],
  "Poland": [51.9194, 19.1451],
  "Japan": [36.2048, 138.2529],
  "Thailand": [15.8700, 100.9925],
  "Vietnam": [14.0583, 108.2772],
  "India": [20.5937, 78.9629],
  "Indonesia": [-0.7893, 113.9213],
  "South Korea": [35.9078, 127.7669],
  "Malaysia": [4.2105, 101.9758],
  "Singapore": [1.3521, 103.8198],
  "Philippines": [12.8797, 121.7740],
  "Taiwan": [23.6978, 120.9605],
  "USA": [37.0902, -95.7129],
  "Canada": [56.1304, -106.3468],
  "Mexico": [23.6345, -102.5528],
  "Brazil": [-14.2350, -51.9253],
  "Argentina": [-38.4161, -63.6167],
  "Peru": [-9.1900, -75.0152],
  "Colombia": [4.5709, -74.2973],
  "Chile": [-35.6751, -71.5430],
  "South Africa": [-30.5595, 22.9375],
  "Morocco": [31.7917, -7.0926],
  "Egypt": [26.8206, 30.8025],
  "Kenya": [-0.0236, 37.9062],
  "Tanzania": [-6.3690, 34.8888],
  "Mauritius": [-20.3484, 57.5522],
  "Australia": [-25.2744, 133.7751],
  "New Zealand": [-40.9006, 174.8860],
  "Fiji": [-17.7134, 178.0650],
  // Cities
  "Rome": [41.9028, 12.4964],
  "Milan": [45.4642, 9.1900],
  "Venice": [45.4408, 12.3155],
  "Florence": [43.7696, 11.2558],
  "Naples": [40.8518, 14.2681],
  "Amalfi Coast": [40.6333, 14.6029],
  "Paris": [48.8566, 2.3522],
  "Lyon": [45.7640, 4.8357],
  "Nice": [43.7102, 7.2620],
  "Marseille": [43.2965, 5.3698],
  "Bordeaux": [44.8378, -0.5792],
  "Barcelona": [41.3851, 2.1734],
  "Madrid": [40.4168, -3.7038],
  "Seville": [37.3891, -5.9845],
  "Valencia": [39.4699, -0.3774],
  "Ibiza": [38.9067, 1.4206],
  "London": [51.5074, -0.1278],
  "Edinburgh": [55.9533, -3.1883],
  "Manchester": [53.4808, -2.2426],
  "Bath": [51.3758, -2.3599],
  "Berlin": [52.5200, 13.4050],
  "Munich": [48.1351, 11.5820],
  "Frankfurt": [50.1109, 8.6821],
  "Hamburg": [53.5511, 9.9937],
  "Lisbon": [38.7223, -9.1393],
  "Porto": [41.1579, -8.6291],
  "Faro": [37.0194, -7.9322],
  "Sintra": [38.8029, -9.3817],
  "Athens": [37.9838, 23.7275],
  "Santorini": [36.3932, 25.4615],
  "Mykonos": [37.4467, 25.3289],
  "Crete": [35.2401, 24.8093],
  "Amsterdam": [52.3676, 4.9041],
  "Rotterdam": [51.9225, 4.4792],
  "Utrecht": [52.0907, 5.1214],
  "Zurich": [47.3769, 8.5417],
  "Geneva": [46.2044, 6.1432],
  "Lucerne": [47.0502, 8.3093],
  "Dubrovnik": [42.6507, 18.0944],
  "Split": [43.5081, 16.4402],
  "Zagreb": [45.8150, 15.9819],
  "Istanbul": [41.0082, 28.9784],
  "Cappadocia": [38.6431, 34.8289],
  "Antalya": [36.8969, 30.7133],
  "Reykjavik": [64.1466, -21.9426],
  "Warsaw": [52.2297, 21.0122],
  "Krakow": [50.0647, 19.9450],
  "Tokyo": [35.6762, 139.6503],
  "Kyoto": [35.0116, 135.7681],
  "Osaka": [34.6937, 135.5023],
  "Hokkaido": [43.2203, 142.8635],
  "Okinawa": [26.3344, 127.8056],
  "Bangkok": [13.7563, 100.5018],
  "Chiang Mai": [18.7883, 98.9853],
  "Phuket": [7.8804, 98.3922],
  "Koh Samui": [9.5120, 100.0136],
  "Hanoi": [21.0285, 105.8542],
  "Ho Chi Minh City": [10.8231, 106.6297],
  "Da Nang": [16.0544, 108.2022],
  "New Delhi": [28.6139, 77.2090],
  "Mumbai": [19.0760, 72.8777],
  "Jaipur": [26.9124, 75.7873],
  "Goa": [15.2993, 74.1240],
  "Bali": [-8.4095, 115.1889],
  "Jakarta": [-6.2088, 106.8456],
  "Seoul": [37.5665, 126.9780],
  "Busan": [35.1796, 129.0756],
  "Jeju": [33.4996, 126.5312],
  "Kuala Lumpur": [3.1390, 101.6869],
  "Penang": [5.4141, 100.3288],
  "Manila": [14.5995, 120.9842],
  "Boracay": [11.9674, 121.9248],
  "Palawan": [9.8349, 118.7384],
  "Taipei": [25.0330, 121.5654],
  "New York": [40.7128, -74.0060],
  "Los Angeles": [34.0522, -118.2437],
  "Chicago": [41.8781, -87.6298],
  "Miami": [25.7617, -80.1918],
  "Las Vegas": [36.1699, -115.1398],
  "San Francisco": [37.7749, -122.4194],
  "Toronto": [43.6510, -79.3470],
  "Vancouver": [49.2827, -123.1207],
  "Montreal": [45.5017, -73.5673],
  "Banff": [51.1784, -115.5708],
  "Mexico City": [19.4326, -99.1332],
  "Cancun": [21.1619, -86.8515],
  "Tulum": [20.2114, -87.4654],
  "Oaxaca": [17.0732, -96.7266],
  "Rio de Janeiro": [-22.9068, -43.1729],
  "São Paulo": [-23.5505, -46.6333],
  "Buenos Aires": [-34.6037, -58.3816],
  "Mendoza": [-32.8895, -68.8458],
  "Patagonia": [-41.8102, -68.9063],
  "Lima": [-12.0464, -77.0428],
  "Cusco": [-13.5226, -71.9673],
  "Machu Picchu": [-13.1631, -72.5450],
  "Bogota": [4.7110, -74.0721],
  "Medellin": [6.2442, -75.5812],
  "Cartagena": [10.3910, -75.4794],
  "Santiago": [-33.4489, -70.6693],
  "Cape Town": [-33.9249, 18.4241],
  "Johannesburg": [-26.2041, 28.0473],
  "Marrakech": [31.6295, -7.9811],
  "Casablanca": [33.5731, -7.5898],
  "Fes": [34.0331, -5.0003],
  "Cairo": [30.0444, 31.2357],
  "Luxor": [25.6872, 32.6396],
  "Giza": [30.0131, 31.2089],
  "Nairobi": [-1.2921, 36.8219],
  "Mombasa": [-4.0435, 39.6682],
  "Zanzibar": [-6.1659, 39.2026],
  "Serengeti": [-2.3333, 34.8333],
  "Port Louis": [-20.1609, 57.5012],
  "Sydney": [-33.8688, 151.2093],
  "Melbourne": [-37.8136, 144.9631],
  "Brisbane": [-27.4698, 153.0251],
  "Gold Coast": [-28.0167, 153.4000],
  "Auckland": [-36.8485, 174.7633],
  "Queenstown": [-45.0312, 168.6626],
  "Wellington": [-41.2865, 174.7762],
  "Nadi": [-17.8000, 177.4167],
  "Suva": [-18.1416, 178.4419]
};

interface Q1Props {
  value: string;
  onChange: (city: string, country: string) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Departure({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q1Props) {
  const [confirmed, setConfirmed] = useState(value || "");
  const [country, setCountry] = useState("");
  const [inputVal, setInputVal] = useState(value || "");
  const [suggestions, setSuggestions] = useState<{ name: string; subtitle?: string }[]>([]);
  const [focused, setFocused] = useState(false);

  const toTitleCase = (s: string) =>
    s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // Autocomplete: instant local matches + debounced Nominatim
  useEffect(() => {
    if (confirmed || inputVal.length < 2) { setSuggestions([]); return; }
    const lower = inputVal.toLowerCase();
    const local = KNOWN_CITIES
      .filter(c => c.toLowerCase().startsWith(lower))
      .slice(0, 5)
      .map(name => ({ name }));
    setSuggestions(local);

    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputVal)}&format=json&limit=6&addressdetails=1`,
          { headers: { "User-Agent": "Breeze.AI" } }
        );
        const data = await res.json();
        const remote = (data as any[])
          .map(d => ({
            name: d.address?.city || d.address?.town || d.address?.village || d.name,
            subtitle: d.address?.country,
          }))
          .filter(d => d.name);
        setSuggestions(prev => {
          const merged = [...prev];
          for (const r of remote) {
            if (!merged.find(m => m.name.toLowerCase() === r.name.toLowerCase())) merged.push(r);
          }
          return merged.slice(0, 6);
        });
      } catch { /* keep local results */ }
    }, 350);
    return () => clearTimeout(t);
  }, [inputVal, confirmed]);

  const confirmCity = (name: string, detectedCountry?: string) => {
    const trimmed = toTitleCase(name.trim());
    if (!trimmed) return;
    setConfirmed(trimmed);
    setInputVal(trimmed);
    const c = detectedCountry || country;
    onChange(trimmed, c);
    setSuggestions([]);
  };

  // Fetch country from Nominatim after city is confirmed
  useEffect(() => {
    if (!confirmed) { setCountry(""); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(confirmed)}&format=json&limit=1&addressdetails=1`,
          { headers: { "User-Agent": "Breeze.AI" } }
        );
        const data = await res.json();
        const c: string = data?.[0]?.address?.country ?? "";
        if (c) { setCountry(c); onChange(confirmed, c); }
      } catch { /* keep empty */ }
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed]);

  const clearCity = () => {
    setConfirmed("");
    setCountry("");
    setInputVal("");
    onChange("", "");
    setSuggestions([]);
  };

  const submit = () => {
    const city = confirmed || toTitleCase(inputVal.trim());
    if (!city) return;
    onChange(city, country);
    onAdvance();
  };

  const isNextDisabled = !confirmed && !inputVal.trim();

  // Globe
  const [liveLocation, setLiveLocation] = useState<[number, number] | undefined>(undefined);
  useEffect(() => {
    const city = confirmed;
    if (!city) { setLiveLocation(undefined); return; }
    if (COORDINATE_MAP[city]) { setLiveLocation(COORDINATE_MAP[city]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
        const data = await res.json();
        if (data?.[0]) setLiveLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } catch { /* no globe update */ }
    }, 500);
    return () => clearTimeout(t);
  }, [confirmed]);

  return (
    <QuestionShell
      stepIdx={stepIdx}
      total={total}
      kicker="Question 01"
      title={<>Where are you <span className="serif">flying to?</span></>}
      nextDisabled={isNextDisabled}
      onNext={submit}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
      sideElement={<GlobeAnimation location={liveLocation} dark={dark} />}
    >
      <div style={{ maxWidth: 560 }}>
        {confirmed ? (
          /* Confirmed city chip */
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "var(--accent-soft)", color: "var(--accent-deep)",
              padding: "14px 22px", borderRadius: 999, fontSize: 24, fontWeight: 600,
            }}>
              {confirmed}
              <button onClick={clearCity} style={{
                background: "transparent", border: "none", color: "var(--accent-deep)",
                cursor: "pointer", display: "flex", alignItems: "center", padding: 2,
              }}>
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Input with autocomplete dropdown */
          <div style={{ position: "relative" }}>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (suggestions.length > 0) confirmCity(suggestions[0].name, suggestions[0].subtitle);
                  else if (inputVal.trim()) confirmCity(inputVal);
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder="Type a city, e.g. Tel Aviv"
              autoFocus
              style={{
                width: "100%", padding: "18px 24px", fontSize: 28, fontWeight: 500,
                letterSpacing: "-.02em", background: "var(--bg-2)",
                border: "1px solid var(--border)", borderRadius: "var(--r-l)",
                outline: "none", color: "var(--text)", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />

            {focused && suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "var(--bg-2)", border: "1px solid var(--border)",
                borderRadius: "var(--r-l)", overflow: "hidden", zIndex: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,.08)",
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => confirmCity(s.name, s.subtitle)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "13px 20px", textAlign: "left",
                      background: "transparent", border: "none",
                      borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 500, color: "var(--text)" }}>{s.name}</span>
                    {s.subtitle && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{s.subtitle}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--text-3)" }}>
          {confirmed
            ? "City selected · press Continue or Enter to proceed"
            : "Select a suggestion or press Enter to confirm"}
        </p>
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
  const today = new Date().toISOString().split('T')[0];

  const clampToFuture = (dateStr: string) => (dateStr < today ? today : dateStr);

  const [start, setStart] = useState(() => {
    try { return clampToFuture(new Date(value?.start).toISOString().split('T')[0]); }
    catch { return today; }
  });
  const [end, setEnd] = useState(() => {
    try { return clampToFuture(new Date(value?.end).toISOString().split('T')[0]); }
    catch { return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]; }
  });

  const handleStartChange = (newStart: string) => {
    setStart(newStart);
    if (end < newStart) setEnd(newStart);
  };

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
            min={today}
            onChange={(e) => handleStartChange(e.target.value)}
            style={{ width: "100%", padding: "16px 20px", fontSize: 24, borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <div>
          <label style={{ display: "block", color: "var(--text-3)", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>End Date</label>
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
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

const COMP_DEFAULTS: Record<string, number> = { solo: 1, couple: 2, family: 4, friends: 3 };
const GENDERS = ["Male", "Female", "Other"];

function makeDefaultTravelers(comp: string): Traveler[] {
  return Array.from({ length: COMP_DEFAULTS[comp] ?? 1 }, () => ({ age: "", gender: "" }));
}

interface Q3Props {
  value: { comp: string | null; travelers: Traveler[] };
  onChange: (v: { comp: string | null; travelers: Traveler[] }) => void;
  onAdvance: () => void;
  onBack: () => void;
  stepIdx: number;
  total: number;
  dark: boolean;
  onToggle: () => void;
}

export function Q_Composition({ value, onChange, onAdvance, onBack, stepIdx, total, dark, onToggle }: Q3Props) {
  const [sel, setSel] = useState<string | null>(value.comp);
  const [travelers, setTravelers] = useState<Traveler[]>(() =>
    value.travelers.length > 0 ? value.travelers : value.comp ? makeDefaultTravelers(value.comp) : []
  );

  const selectComp = (id: string) => {
    setSel(id);
    setTravelers(makeDefaultTravelers(id));
  };

  const updateTraveler = (i: number, field: keyof Traveler, val: string) =>
    setTravelers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));

  const addTraveler = () => setTravelers((prev) => [...prev, { age: "", gender: "" }]);
  const removeTraveler = (i: number) => setTravelers((prev) => prev.filter((_, idx) => idx !== i));

  const isNextDisabled = !sel || travelers.length === 0 || travelers.some((t) => !t.age.trim() || !t.gender);

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
      nextDisabled={isNextDisabled}
      onNext={() => {
        if (!isNextDisabled) {
          onChange({ comp: sel!, travelers });
          onAdvance();
        }
      }}
      onBack={onBack}
      dark={dark}
      onToggle={onToggle}
    >
      {/* Composition type selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, maxWidth: 880 }}>
        {COMP_OPTIONS.map((o) => {
          const active = sel === o.id;
          return (
            <button
              key={o.id}
              onClick={() => selectComp(o.id)}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
                <CompositionGlyph n={o.n} active={active} />
                {active && <Icon name="check" size={18} stroke="var(--accent-deep)" />}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.01em" }}>{o.label}</div>
              <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>{o.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Traveler cards */}
      {sel && (
        <div style={{ marginTop: 36, maxWidth: 880 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
            {travelers.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 18px",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-l)",
                }}
              >
                {/* Card header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-deep)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                    Traveler {i + 1}
                  </span>
                  {travelers.length > 1 && (
                    <button
                      onClick={() => removeTraveler(i)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, display: "flex", alignItems: "center" }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>

                {/* Age */}
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Age</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={t.age}
                  onChange={(e) => updateTraveler(i, "age", e.target.value)}
                  placeholder="e.g. 32"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 18,
                    fontWeight: 500,
                    borderRadius: "var(--r)",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />

                {/* Gender */}
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: ".08em", textTransform: "uppercase", margin: "14px 0 6px" }}>Gender</label>
                <div style={{ display: "flex", gap: 5 }}>
                  {GENDERS.map((g) => {
                    const gVal = g.toLowerCase();
                    const active = t.gender === gVal;
                    return (
                      <button
                        key={g}
                        onClick={() => updateTraveler(i, "gender", gVal)}
                        style={{
                          flex: 1,
                          padding: "7px 0",
                          fontSize: 12,
                          fontWeight: 600,
                          background: active ? "var(--accent-soft)" : "transparent",
                          border: "1px solid",
                          borderColor: active ? "var(--accent)" : "var(--border)",
                          borderRadius: "var(--r)",
                          color: active ? "var(--accent-deep)" : "var(--text-2)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all .2s var(--ease)",
                        }}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Add traveler button */}
          <button
            onClick={addTraveler}
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              background: "transparent",
              border: "1px dashed var(--border)",
              borderRadius: "var(--r-l)",
              color: "var(--text-2)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .2s var(--ease)",
            }}
          >
            <Icon name="plus" size={16} />
            Add traveler
          </button>
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
