# Breeze.ai

AI-powered travel planning. Answer four questions, pick your interests, and get a full day-by-day itinerary — tuned to what you actually want to do.

---

## Agent Architecture

```
User
  |
  v
┌─────────────────────────────────────────┐
│           Orchestrator                  │
│         (Claude Sonnet 4.6)             │
│  Manages conversation, collects input,  │
│  consolidates results, handles feedback │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        v                 v
┌───────────────┐  ┌──────────────────────────────────┐
│   Scheduler   │  │       AttractionManager          │
│ (Haiku 4.5)   │  │         (Haiku 4.5)              │
│               │  │                                  │
│ Gets pool of  │  │  Routes to sub-agents based on   │
│ attractions   │  │  user's selected preferences     │
│ Groups into   │  └──────────────┬───────────────────┘
│ 2-3 per day   │                 │
│ Assigns to    │    ┌────────────┼────────────┐
│ time slots    │    │            │            │
└───────────────┘    v            v            v
              Restaurants   Nightlife     History
              (Google       (Foursquare   (OpenTripMap
               Places)       + Tavily)    + Wikipedia)

              Sports        Extreme       Treks
              (Tavily)      (Tavily)      (OpenTripMap)

              Beach         Spa           Music & Events
              (Google       (Google       (Ticketmaster
               Places)       Places)      + Eventbrite)

              Shopping      Viral Spots
              (Foursquare)  (Tavily)
```

---

## User Flow

```
┌─────────────┐
│   Welcome   │  "Hello, Lisbon."
└──────┬──────┘
       │
       v
┌─────────────┐
│  Question 1 │  Where did you fly in from?
└──────┬──────┘
       │
       v
┌─────────────┐
│  Question 2 │  How long are you staying?
└──────┬──────┘
       │
       v
┌─────────────┐
│  Question 3 │  Who are you traveling with?
│             │  Solo / Couple / Family / Friends
└──────┬──────┘
       │
       v
┌─────────────┐
│  Question 4 │  What's your daily budget?
│             │  Budget / Comfort / Luxury
└──────┬──────┘
       │
       v
┌─────────────┐
│ Preferences │  Pick your interests (multi-select):
│             │  Restaurants · Nightlife · History
│             │  Sports · Extreme · Treks · Beach
│             │  Spa · Music & Events · Shopping · Viral
└──────┬──────┘
       │
       v
┌─────────────┐
│ Generating  │  Orchestrator activates only the
│             │  sub-agents matching selected interests
│             │  → AttractionManager fetches data
│             │  → Scheduler builds day-by-day plan
└──────┬──────┘
       │
       v
┌─────────────┐
│  Itinerary  │  Full trip: day sidebar + activity cards
│             │  + weather + budget tracker
│             │
│  Feedback   │  "Love it, or want changes?"
│  loop       │  → User gives plain-English feedback
│             │  → Orchestrator re-plans the relevant slice
│             │  → New itinerary (iterate as needed)
└─────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js 14 (App Router) |
| Orchestrator agent | Claude Sonnet 4.6 |
| Sub-agents | Claude Haiku 4.5 |
| Cache | Upstash Redis (TTL 48h) |
| Hosting | Vercel |

### Data Sources

| Category | API |
|----------|-----|
| Restaurants, Spa, Beach, Shopping | Google Places API |
| Nightlife, Bars | Foursquare Places API |
| Historical sites, Treks, Nature | OpenTripMap API |
| Music, Events, Festivals | Ticketmaster API + Eventbrite API |
| Viral spots, Extreme, Sports | Tavily Search API |
| Historical descriptions | Wikipedia API (free, no key) |
| Weather per day | OpenWeatherMap API |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  layout.tsx          # Root layout + Google Fonts
  page.tsx            # Entry point
  globals.css         # CSS variables (Mediterranean palette + dark mode)

components/
  BreezeApp.tsx       # State orchestrator — manages screen transitions
  WelcomeScreen.tsx
  QuestionScreens.tsx # Q1–Q4 (departure, dates, composition, budget)
  PreferencesScreen.tsx
  GeneratingScreen.tsx
  ItineraryScreen.tsx
  types.ts            # Shared TypeScript types
  ui/
    index.tsx         # TopBar, IconBtn, PrimaryBtn, SoftBtn
    svgs.tsx          # Wordmark, CityMap, WeatherIcon, Icon library
```
