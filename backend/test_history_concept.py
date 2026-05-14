import httpx
import asyncio

async def test_concept():
    city = "Paris"
    overpass_url = "https://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json];
    area[name="{city}"]->.searchArea;
    (
      node["historic"~"monument|castle|ruins"](area.searchArea);
      way["historic"~"monument|castle|ruins"](area.searchArea);
      node["tourism"="museum"](area.searchArea);
      way["tourism"="museum"](area.searchArea);
    );
    out center 5;
    """

    print(f"1. Querying Overpass API for {city}...")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            overpass_url,
            params={'data': overpass_query},
            headers={'User-Agent': 'Breeze.AI Hackathon Project'}
        )
        data = res.json()

    elements = data.get('elements', [])
    print(f"   Found {len(elements)} raw historic sites.\n")
    
    print("2. Fetching Wikipedia extracts for top 3 sites...")
    
    wiki_url = "https://en.wikipedia.org/w/api.php"
    
    for el in elements[:3]:
        tags = el.get('tags', {})
        name = tags.get('name')
        if not name:
            continue
            
        print(f"\n--- Site: {name} ---")
        async with httpx.AsyncClient(timeout=10) as client:
            wiki_res = await client.get(wiki_url, params={
                "action": "query",
                "generator": "search",
                "gsrsearch": name,
                "gsrlimit": 1,
                "prop": "extracts",
                "exintro": "1",
                "explaintext": "1",
                "format": "json"
            }, headers={"User-Agent": "Breeze.AI Hackathon Project"})
            
            wiki_data = wiki_res.json()
            pages = wiki_data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                if page_id != "-1" and "extract" in page_data:
                    # Clean up unicode for Windows printing
                    clean_extract = page_data.get("extract")[:300].encode("ascii", "ignore").decode("ascii")
                    print(f"Wikipedia Description: {clean_extract}...")
                    break
            else:
                print("Wikipedia Description: [No direct English Wikipedia match found. Will fallback to AI]")

if __name__ == "__main__":
    asyncio.run(test_concept())
