import asyncio
from dotenv import load_dotenv

# Load environment variables (API_KEY_TAVILY, API_KEY_LLM, etc.)
load_dotenv()

from agents.sub_agents.beach import fetch_beach

async def main():
    print("Starting Beach Subagent Test...")
    print("This will trigger the LLM, which will call the Tavily search tool, read the results, and generate structured data.\n")
    
    city = "Tel Aviv"
    print(f"Requesting beaches for: {city}...\n")
    
    attractions = await fetch_beach(city)
    
    print("=== FINAL RESULT ===")
    if not attractions:
        print("No attractions returned or error parsing.")
    else:
        for idx, attr in enumerate(attractions, 1):
            print(f"{idx}. {attr.name}")
            print(f"   Description: {attr.description}")
            print(f"   Address: {attr.address}")
            print()
            
    print("Test complete! Check LangSmith to see the tool use execution trace!")

if __name__ == "__main__":
    asyncio.run(main())
