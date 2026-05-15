import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

from agents.attraction_manager import run_attraction_manager
from agents.scheduler import run_scheduler
from agents.orchestrator import generate_itinerary

async def test_orchestrator():
    print("Testing Orchestrator with User Feedback Routing...\n")
    
    input_data = {
        "userName": "The Patel Family",
        "session_id": "b1c4e7a9-52d8-493e-a1b6-8d5f3c2e7a4b",
        "groupRelation": "family",
        "groupStructure": {
            "1": {"gender": "male", "age": 45},
            "2": {"gender": "female", "age": 43},
            "3": {"gender": "male", "age": 16},
            "4": {"gender": "female", "age": 14},
            "5": {"gender": "female", "age": 72}
        },
        "budget": 2,
        "dates": {"start": "2026-08-15", "end": "2026-08-22"},
        "daysNumber": 8,
        "location": {"country": "USA", "city": "Orlando"},
        "accessibility": True,
        "interests": ["events", "shopping", "restaurants"],
        "departure": "New York"
    }

    user_rejections = "I don't like seafood restaurants, please replace them. Also, can we move our shopping day to Monday?"

    try:
        print("1. Running Attraction Manager manually to see pool...")
        pool = await run_attraction_manager(input_data)
        print(f"Pool Size: {sum(len(c.get('results', [])) for c in pool)} attractions")
        
        print("\n2. Running Scheduler manually to see schedule...")
        schedule = await run_scheduler(
            city="Orlando",
            days=8,
            start_date="2026-08-15",
            attraction_pool=pool,
            scheduling_rejections="move our shopping day to Monday"
        )
        print(f"Schedule Size: {len(schedule)} days")
        print("Schedule output snippet: ", json.dumps(schedule[:1], indent=2))
        
        print("\n3. Running Full generate_itinerary()...")
        final_itinerary = await generate_itinerary(
            input_data=input_data,
            user_rejections=user_rejections,
            previous_pool=pool
        )
        
        print("\nFinal Itinerary JSON:\n")
        print(json.dumps(final_itinerary, indent=2))
        
    except Exception as e:
        print(f"Error testing Orchestrator: {e}")

if __name__ == "__main__":
    asyncio.run(test_orchestrator())
