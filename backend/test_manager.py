import asyncio
from dotenv import load_dotenv
load_dotenv()

from agents.attraction_manager import run_attraction_manager

async def test():
    print("Running attraction manager for shopping in New York...")
    results = await run_attraction_manager(
        city="New York",
        budget="luxury",
        composition="couple",
        interests=["shopping"],
        start_date="2026-06-01",
        end_date="2026-06-05",
        days=4
    )
    
    print(f"\nManager returned {len(results)} filtered/curated attractions:")
    for r in results:
        print(f"- {r.name}: {r.description[:50]}...")

if __name__ == "__main__":
    asyncio.run(test())
