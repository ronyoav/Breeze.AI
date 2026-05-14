import asyncio
from dotenv import load_dotenv

# Load environment variables so LangSmith and API keys work!
load_dotenv()

from agents.sub_agents.treks import fetch_treks
from utils.llm import async_client, MODEL_HAIKU
from langsmith import traceable

@traceable(name="Trek Advisor Agent")
async def analyze_treks_for_month(city: str, month: str):
    """
    Logic behind the scenes:
    1. First, we get raw geographic data from OpenTripMap (via existing fetch_treks).
    2. Then, we use the LLM to analyze those raw locations to see if they are good for the specific month.
    """
    print(f"1. Fetching raw geographic data for {city} from OpenTripMap...")
    raw_treks = await fetch_treks(city)
    
    # Extract just the names of the attractions found
    trek_names = [t.name for t in raw_treks if t.name]
    print(f"   Found {len(trek_names)} natural spots in the area.")
    
    print(f"2. Asking AI (Haiku) to analyze the treks for {month}...")
    system_prompt = (
        "You are a specialized Hiking Trek Subagent. "
        "You are given a list of natural attractions and treks near a city. "
        "Tell the user which of these are actually good for hiking during the requested month. "
        "Filter out generic parks if possible and focus on real treks/nature. "
        "Provide a short, bulleted recommendation list with 1-sentence explanations."
    )
    
    user_prompt = f"City: {city}\nMonth: {month}\nAvailable Spots from API: {trek_names}"
    
    response = await async_client.messages.create(
        model=MODEL_HAIKU,
        max_tokens=1024,
        temperature=0.3,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )
    
    return response.content[0].text

async def main():
    print("Starting Test...")
    recommendations = await analyze_treks_for_month("Milan", "May")
    
    print("\n=== AI RECOMMENDATION ===")
    print(recommendations)
    print("=========================")
    print("\nTest complete! Go check your LangSmith dashboard!")

if __name__ == "__main__":
    asyncio.run(main())
