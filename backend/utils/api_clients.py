import os
import httpx
from dotenv import load_dotenv

load_dotenv()


def _env(key: str) -> str:
    v = os.getenv(key)
    if not v:
        raise EnvironmentError(f"Missing env var: {key}")
    return v


GOOGLE_PLACES_BASE = "https://maps.googleapis.com/maps/api/place"
FOURSQUARE_BASE = "https://api.foursquare.com/v3/places"
OVERPASS_BASE = "https://overpass-api.de/api/interpreter"
OPENTRIPMAP_BASE = "https://api.opentripmap.com/0.1/en/places"
TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2"
EVENTBRITE_BASE = "https://www.eventbriteapi.com/v3"
OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"
TAVILY_BASE = "https://api.tavily.com"


def google_key() -> str:
    return _env("GOOGLE_PLACES_API_KEY")

def foursquare_key() -> str:
    return _env("FOURSQUARE_API_KEY")

def opentripmap_key() -> str:
    return _env("OPENTRIPMAP_API_KEY")

def ticketmaster_key() -> str:
    return _env("TICKETMASTER_API_KEY")

def eventbrite_key() -> str:
    return _env("EVENTBRITE_API_KEY")

def openweather_key() -> str:
    return _env("OPENWEATHER_API_KEY")

def tavily_key() -> str:
    return _env("API_KEY_TAVILY")


async def tavily_search(query: str, max_results: int = 5) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            f"{TAVILY_BASE}/search",
            json={"api_key": tavily_key(), "query": query, "max_results": max_results},
        )
        res.raise_for_status()
        return res.json()
