import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from agents.sub_agents.nightlife import fetch_nightlife

async def main():
    results = await fetch_nightlife("Tel Aviv", "medium")
    print(f"Got {len(results)} results")
    for r in results:
        print(r.name, "|", r.description[:80])

asyncio.run(main())
