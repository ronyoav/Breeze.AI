import asyncio
from dotenv import load_dotenv

load_dotenv()

from agents.sub_agents.shopping import fetch_shopping

async def test_agent():
    # Provide the mock user profile directly
    user_profile = {
        "userName": "College Bros",
        "session_id": "c8d1f3b5-92e4-41d8-a63c-7e81b5d4a9f1",
        "groupRelation": "friends",
        "groupStructure": {
            "1": {"gender": "male", "age": 21},
            "2": {"gender": "male", "age": 21},
            "3": {"gender": "male", "age": 22}
        },
        "budget": 1,
        "dates": {"start": "2026-03-10", "end": "2026-03-15"},
        "daysNumber": 6,
        "location": {"country": "France", "city": "Paris"}, # Test in Paris
        "accessibility": False,
        "interests": ["shopping", "nightlife", "sports"]
    }

    print("Searching for shopping spots using the dynamic Claude scoring agent...")
    
    try:
        results = await fetch_shopping(user_profile)
        
        print(f"\nFound {len(results)} highly-curated shopping results:")
        
        for place in results:
            safe_name = place.name.encode('ascii', 'replace').decode('ascii')
            safe_address = place.address.encode('ascii', 'replace').decode('ascii')
            safe_desc = place.description.encode('ascii', 'replace').decode('ascii') if place.description else "No description"
            safe_notes = place.notes.encode('ascii', 'replace').decode('ascii') if place.notes else "None"
            
            print(f"\n- {safe_name}")
            print(f"  Address: {safe_address}")
            print(f"  Description: {safe_desc}")
            print(f"  AI Score: {place.subAgentScore}")
            print(f"  Notes: {safe_notes}")
            
    except Exception as e:
        print(f"\nError occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_agent())
