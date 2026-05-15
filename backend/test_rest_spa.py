import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

from agents.sub_agents.restaurants import fetch_restaurants
from agents.sub_agents.spa import fetch_spa

async def test_rest_spa():
    user_profile = {
        "userName": "Alex Smith",
        "groupRelation": "friends",
        "groupStructure": {
            "1": {"gender": "male", "age": 25},
            "2": {"gender": "female", "age": 24}
        },
        "budget": 2, # Mid-tier
        "dates": {"start": "2026-07-10", "end": "2026-07-15"},
        "daysNumber": 5,
        "location": {"country": "Japan", "city": "Tokyo"},
        "accessibility": False,
        "interests": ["history", "shopping", "anime"],
        "session_id": "test_tokyo_rest_spa"
    }

    print("Testing Restaurants Agent...")
    try:
        rest_results = await fetch_restaurants(user_profile)
        print(f"\nFound {len(rest_results)} restaurant results:")
        for r in rest_results:
            safe_name = r.name.encode('ascii', 'replace').decode('ascii')
            safe_desc = r.description.encode('ascii', 'replace').decode('ascii') if r.description else "No description"
            print(f"- {safe_name} (Score: {r.subAgentScore}): {safe_desc}")
    except Exception as e:
        print(f"Error testing Restaurants: {e}")

    print("\n" + "="*50 + "\n")

    print("Testing Spa Agent...")
    try:
        spa_results = await fetch_spa(user_profile)
        print(f"\nFound {len(spa_results)} spa results:")
        for s in spa_results:
            safe_name = s.name.encode('ascii', 'replace').decode('ascii')
            safe_desc = s.description.encode('ascii', 'replace').decode('ascii') if s.description else "No description"
            print(f"- {safe_name} (Score: {s.subAgentScore}): {safe_desc}")
    except Exception as e:
        print(f"Error testing Spa: {e}")

if __name__ == "__main__":
    asyncio.run(test_rest_spa())
