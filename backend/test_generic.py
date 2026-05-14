import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from agents.sub_agents.generic import fetch_generic

# --- שנה כאן ---
CITY = "Tel Aviv"
CATEGORY = "water park"
BUDGET = "medium"
# ----------------

async def main():
    print(f"--- {CATEGORY} in {CITY} (budget: {BUDGET}) ---\n")
    results = await fetch_generic(CITY, CATEGORY, BUDGET)
    print(f"Got {len(results)} results\n")
    for r in results:
        print(f"  {r.name} [{r.category}]")
        print(f"  {r.description}")
        print(f"  Tip: {r.tip}")
        print()

asyncio.run(main())
