import asyncio
from duckduckgo_search import DDGS
from utils.api_clients import tavily_search

# Global lock to serialize image requests and avoid DuckDuckGo 403 Rate Limits
_image_lock = asyncio.Lock()

SEARCH_TOOL = {
    "name": "search_web",
    "description": (
        "Search the web for real-time travel information. "
        "Use this to find venues, activities, restaurants, events, or any location-based data."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Specific search query to find relevant results",
            },
            "max_results": {
                "type": "integer",
                "description": "Number of results to return (default 8, max 10)",
            },
        },
        "required": ["query"],
    },
}

DUCKDUCKGO_IMAGE_TOOL = {
    "name": "duckduckgo_image",
    "description": (
        "Search for an image URL of a specific location or venue."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The exact name of the venue and city (e.g., 'Eiffel Tower Paris')",
            }
        },
        "required": ["query"],
    },
}

def _sync_fetch_image(query: str) -> str:
    with DDGS() as ddgs:
        results = ddgs.images(
            keywords=query,
            region="wt-wt",
            safesearch="moderate",
            max_results=1,
        )
        for r in results:
            return r.get("image", "")
    return ""

async def fetch_image_url(query: str) -> str:
    """
    Uses DuckDuckGo to search for an image and returns the URL.
    Employs an async lock, stagger delay, and retry backoff to avoid 403 Rate Limits.
    """
    for attempt in range(3):
        try:
            async with _image_lock:
                # Add a 1.5-second stagger to prevent hitting DuckDuckGo too rapidly
                await asyncio.sleep(1.5)
                # Run the synchronous DuckDuckGo search in a background thread
                url = await asyncio.to_thread(_sync_fetch_image, query)
                return url
        except Exception as e:
            err_str = str(e)
            print(f"[Image Tool] Error fetching image for '{query}' (Attempt {attempt+1}/3): {err_str}")
            if "403" in err_str or "Ratelimit" in err_str:
                # Exponential backoff outside the lock so other tasks can run
                await asyncio.sleep(2 ** attempt)
            else:
                break
    return ""
