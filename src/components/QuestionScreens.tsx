"use client";

import { useState, useEffect } from "react";
import { TopBar, PrimaryBtn, SoftBtn, IconBtn, Icon } from "./ui";
import { GlobeAnimation } from "./GlobeAnimation";

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

  const toTitleCase = (str: string) =>
    str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const currentContinent = selections[0];
  const currentCountry = selections[1];
  const currentCities = selections.slice(2);

  let options: string[] = [];
  let placeholder = "";

  if (!currentContinent) {
    options = Object.keys(DESTINATION_TREE);
    placeholder = "";
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
    const trimmed = toTitleCase(customText.trim());
    if (trimmed && !finalCities.includes(trimmed)) {
      finalCities.push(trimmed);
    }
    if (finalCities.length > 0 || (selections.length >= 2 && customText.trim())) {
      onChange(finalCities.join(", "));
      onAdvance();
    }
  };

  const isNextDisabled = selections.length < 2 || (currentCities.length === 0 && !customText.trim());

  const currentCityForGlobe = currentCities.length > 0 ? currentCities[currentCities.length - 1] : selections[selections.length - 1];
  const [liveLocation, setLiveLocation] = useState<[number, number] | undefined>(undefined);

  useEffect(() => {
    if (!currentCityForGlobe) {
      setLiveLocation(undefined);
      return;
    }

    if (COORDINATE_MAP[currentCityForGlobe]) {
      setLiveLocation(COORDINATE_MAP[currentCityForGlobe]);
      return;
    }

    // Live Geocoding for custom destinations
    const fetchCoords = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(currentCityForGlobe)}&format=json&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          setLiveLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    };
    
    // Add small delay to prevent rapid requests if user is typing
    const t = setTimeout(fetchCoords, 500);
    return () => clearTimeout(t);
  }, [currentCityForGlobe]);

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
      sideElement={<GlobeAnimation location={liveLocation} dark={dark} />}
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
            onChange={(e) => setCustomText(toTitleCase(e.target.value))}
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
