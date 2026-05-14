import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

from agents.sub_agents.beach import fetch_beach
from agents.sub_agents.events import fetch_events
from agents.sub_agents.extreme import fetch_extreme
from agents.sub_agents.generic import fetch_generic
from agents.sub_agents.nightlife import fetch_nightlife
from agents.sub_agents.spa import fetch_spa
from agents.sub_agents.sports import fetch_sports
from agents.sub_agents.treks import fetch_treks
from agents.sub_agents.viral import fetch_viral

user_profile = {
    "location": {"city": "Miami"},
    "budget": 3,  # Luxury
    "groupStructure": "Couple on honeymoon",
    "interests": ["relaxation", "adventure", "nightlife"],
    "dates": {"start": "2026-06-01", "end": "2026-06-05"},
    "daysNumber": 5,
    "session_id": "test_session_123"
}

async def test_all():
    print(f"Testing with User Profile: {json.dumps(user_profile, indent=2)}")
    
    print("\n--- Testing Beach Agent ---")
    try:
        res = await fetch_beach(user_profile)
        print(f"Found {len(res)} beaches. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Beach Agent Error: {e}")

    print("\n--- Testing Events Agent ---")
    try:
        res = await fetch_events(user_profile)
        print(f"Found {len(res)} events. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Events Agent Error: {e}")

    print("\n--- Testing Extreme Agent ---")
    try:
        res = await fetch_extreme(user_profile)
        print(f"Found {len(res)} extreme. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Extreme Agent Error: {e}")

    print("\n--- Testing Generic Agent (Casino) ---")
    try:
        res = await fetch_generic(user_profile, "casino")
        print(f"Found {len(res)} casinos. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Generic Agent Error: {e}")

    print("\n--- Testing Nightlife Agent ---")
    try:
        res = await fetch_nightlife(user_profile)
        print(f"Found {len(res)} nightlife. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Nightlife Agent Error: {e}")

    print("\n--- Testing Spa Agent ---")
    try:
        res = await fetch_spa(user_profile)
        print(f"Found {len(res)} spas. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Spa Agent Error: {e}")

    print("\n--- Testing Sports Agent ---")
    try:
        res = await fetch_sports(user_profile)
        print(f"Found {len(res)} sports. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Sports Agent Error: {e}")

    print("\n--- Testing Treks Agent ---")
    try:
        res = await fetch_treks(user_profile)
        print(f"Found {len(res)} treks. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Treks Agent Error: {e}")

    print("\n--- Testing Viral Agent ---")
    try:
        res = await fetch_viral(user_profile)
        print(f"Found {len(res)} viral spots. First: {res[0].name if res else 'None'}")
    except Exception as e:
        print(f"Viral Agent Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_all())
