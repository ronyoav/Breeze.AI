import httpx
import asyncio

async def test_wiki():
    name = "Eiffel Tower"
    wiki_url = "https://en.wikipedia.org/w/api.php"
    
    async with httpx.AsyncClient() as client:
        res = await client.get(wiki_url, params={
            "action": "query",
            "prop": "extracts",
            "exintro": "1",
            "explaintext": "1",
            "titles": name,
            "format": "json"
        }, headers={"User-Agent": "Breeze.AI Hackathon Project"})
        data = res.json()
        pages = data.get("query", {}).get("pages", {})
        for page_id, page_data in pages.items():
            if page_id != "-1":
                print(f"Title: {page_data.get('title')}")
                print(f"Extract: {page_data.get('extract')[:200]}...")

if __name__ == "__main__":
    asyncio.run(test_wiki())
