import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

from agents.attraction_manager import run_attraction_manager
from agents.scheduler import run_scheduler

async def test_scheduler_only():
    print("Testing Scheduler Clustering Logic...\n")
    
    city = "Tokyo"
    start_date = "2026-07-10"
    end_date = "2026-07-15"
    days = 5
    composition = "friends"
    budget = "2"
    interests = ["history", "shopping", "anime"]
    departure = "New York"
    
    input_data = {
        "location": {"city": city},
        "budget": budget,
        "groupStructure": composition,
        "interests": interests,
        "dates": {"start": start_date, "end": end_date},
        "daysNumber": days,
        "departure": departure
    }
    
    try:
        print("1. Running Attraction Manager to fetch raw pool...")
        pool = await run_attraction_manager(input_data)
        total_items = sum(len(c.get('results', [])) for c in pool)
        print(f"   -> Successfully fetched {total_items} raw attractions.\n")

        print("2. Running Scheduler to group items and attach time/duration...")
        schedule = await run_scheduler(
            city=city,
            days=days,
            start_date=start_date,
            attraction_pool=pool,
        )
        
        print("\n=== SCHEDULER OUTPUT JSON ===")
        print(json.dumps(schedule, indent=2))
        
    except Exception as e:
        print(f"Error testing Scheduler: {e}")

if __name__ == "__main__":
    asyncio.run(test_scheduler_only())
