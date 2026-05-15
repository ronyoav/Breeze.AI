import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

from agents.orchestrator import generate_itinerary

async def test_orchestrator():
    print("Testing full Orchestrator pipeline...\n")
    
    try:
        final_itinerary = await generate_itinerary(
            city="Tokyo",
            departure="New York",
            start_date="2026-07-10",
            end_date="2026-07-15",
            days=5,
            composition="friends",
            budget="2",
            interests=["history", "shopping", "anime"],
            scheduling_rejections=None
        )
        
        print("Orchestrator successfully generated the final itinerary!")
        print("\nFinal Itinerary JSON:\n")
        print(json.dumps(final_itinerary, indent=2))
        
    except Exception as e:
        print(f"Error testing Orchestrator: {e}")

if __name__ == "__main__":
    asyncio.run(test_orchestrator())
