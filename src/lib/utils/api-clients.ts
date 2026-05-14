const env = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
};

export const googlePlaces = {
  baseUrl: "https://maps.googleapis.com/maps/api/place",
  key: () => env("GOOGLE_PLACES_API_KEY"),
};

export const foursquare = {
  baseUrl: "https://api.foursquare.com/v3/places",
  key: () => env("FOURSQUARE_API_KEY"),
};

export const openTripMap = {
  baseUrl: "https://api.opentripmap.com/0.1/en/places",
  key: () => env("OPENTRIPMAP_API_KEY"),
};

export const ticketmaster = {
  baseUrl: "https://app.ticketmaster.com/discovery/v2",
  key: () => env("TICKETMASTER_API_KEY"),
};

export const eventbrite = {
  baseUrl: "https://www.eventbriteapi.com/v3",
  key: () => env("EVENTBRITE_API_KEY"),
};

export const openWeather = {
  baseUrl: "https://api.openweathermap.org/data/2.5",
  key: () => env("OPENWEATHER_API_KEY"),
};

export const tavily = {
  baseUrl: "https://api.tavily.com",
  key: () => env("TAVILY_API_KEY"),
};

export async function tavilySearch(query: string, maxResults = 5) {
  const res = await fetch(`${tavily.baseUrl}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: tavily.key(), query, max_results: maxResults }),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  return res.json();
}
