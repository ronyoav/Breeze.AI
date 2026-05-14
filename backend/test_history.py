import asyncio
from dotenv import load_dotenv

load_dotenv()

from agents.sub_agents.history import fetch_history

async def test_agent():
    print("Searching for historical sites and museums in Paris...")
    
    try:
        results = await fetch_history("Paris")
        
        print(f"\nFound {len(results)} historical results:")
        
        for place in results:
            safe_name = place.name.encode('ascii', 'replace').decode('ascii')
            safe_address = place.address.encode('ascii', 'replace').decode('ascii')
            safe_desc = place.description.encode('ascii', 'replace').decode('ascii')
            
            print(f"\n- {safe_name}")
            print(f"  Address: {safe_address}")
            print(f"  Description: {safe_desc}")
            if place.image_url:
                print(f"  Image URL: {place.image_url}")
            
    except Exception as e:
        print(f"\nError occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_agent())
