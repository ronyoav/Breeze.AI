import asyncio
from agents.sub_agents.nightlife import fetch_nightlife

async def main():
    profile = {
        "location": {"city": "Paris", "country": "France"},
        "groupStructure": {"1": {"age": 25, "gender": "male"}},
        "groupRelation": "friends",
        "budget": 2,
        "session_id": "test_ddg_image_01"
    }
    
    print("Fetching nightlife in Paris...")
    results = await fetch_nightlife(profile)
    for r in results:
        print(f"- {r.name}: {r.imageurl}")

if __name__ == "__main__":
    asyncio.run(main())
