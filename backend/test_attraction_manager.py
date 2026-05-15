import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

from agents.attraction_manager import run_attraction_manager

async def test_attraction_manager():
    input_data = {
      "userName": "Alex Smith",
      "groupRelation": "friends",
      "groupStructure": {
        "1": {"gender": "male", "age": 25},
        "2": {"gender": "female", "age": 24}
      },
      "budget": 2,
      "dates": {"start": "2026-07-10", "end": "2026-07-15"},
      "daysNumber": 5,
      "location": {"country": "Japan", "city": "Tokyo"},
      "accessibility": False,
      "interests": ["history", "shopping", "anime"] # anime will trigger generic subagent
    }

    print(f"Testing AttractionManager with input data:\n{json.dumps(input_data, indent=2)}\n")
    
    try:
        # Run the manager, which spins up history, shopping, and generic(anime)
        results = await run_attraction_manager(input_data)
        
        print(f"\nAttractionManager completed successfully! Received {len(results)} category lists.")
        
        # Pretty print the final JSON
        print("\nFinal Formatted Output:\n")
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        print(f"Error running AttractionManager: {e}")

if __name__ == "__main__":
    asyncio.run(test_attraction_manager())
