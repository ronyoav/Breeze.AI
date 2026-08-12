# Breeze.ai

## Demo
[![Breeze.ai - Technical Demo](https://img.youtube.com/vi/yXYzudMQ8Ns/maxresdefault.jpg)](https://youtu.be/yXYzudMQ8Ns)

AI-powered travel planning. Answer four questions, pick your interests, and get a full day-by-day itinerary — tuned to what you actually want to do.

---

## Agent Architecture

```
User
  |
  v
┌─────────────────────────────────────────┐
│           Orchestrator                  │
│       (Next.js API + Claude)            │
│  Manages conversation, collects input,  │
│  consolidates results, handles feedback │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        v                 v
┌───────────────┐  ┌──────────────────────────────────┐
│   Scheduler   │  │       Interest Agents            │
│(Claude 3.5 H) │  │  Routes to API endpoints based   │
│               │  │  on user's selected preferences  │
│ Gets pool of  │  └──────────────┬───────────────────┘
│ attractions   │                 │
│ Groups into   │    ┌────────────┼────────────┐
│ slots by day  │    │            │            │
└───────────────┘    v            v            v
              Restaurants   Attractions   Treks
              (Tavily +     (Tavily +     (Tavily +
               Claude)       Claude)       Claude)

              Concerts
              (Ticketmaster +
               Eventbrite + Tavily)
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
| Frontend + Backend | Next.js (App Router) |
| Orchestrator/Scheduler | Claude 3.5 Haiku |
| Sub-agents | Claude 3.5 Haiku + Tavily |
| Hosting | Vercel |

### Data Sources

| Category | API |
|----------|-----|
| Restaurants, Attractions, Treks, etc. | Tavily Search API |
| Music & Concerts | Ticketmaster API + Eventbrite API |

---

## Getting Started

1. **Set up environment variables**  
   Create a `.env.local` file in the root of the project and add your API keys:
   ```env
   API_KEY_LLM="your_openrouter_api_key"
   API_KEY_TAVILY="your_tavily_api_key"
   API_KEY_TICKETMASTER="your_ticketmaster_api_key" # Optional, for live music
   API_KEY_EVENTBRITE="your_eventbrite_api_key"     # Optional, for live events
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend** (in a separate terminal, from the `backend/` folder)
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   Runs on [http://localhost:8000](http://localhost:8000)

4. **Start the frontend** (from the project root)
   ```bash
   npm run dev
   ```
   Runs on [http://localhost:3000](http://localhost:3000)

5. **Open the app**  
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
  app/
    api/
      attractions/route.ts
      concerts/route.ts
      restaurants/route.ts
      revise/route.ts
      schedule/route.ts
      treks/route.ts
    layout.tsx
    page.tsx
    globals.css

  components/
    BreezeApp.tsx       # State orchestrator
    WelcomeScreen.tsx
    PreferencesScreen.tsx
    GeneratingScreen.tsx
    ItineraryScreen.tsx
    types.ts            # Shared TypeScript types
    ui/
      index.tsx         
      svgs.tsx          
```
