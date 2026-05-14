# Import the asyncio library to run asynchronous code
import asyncio

# Import the load_dotenv function from the python-dotenv package
from dotenv import load_dotenv

# Load environment variables from the .env file (specifically the FOURSQUARE_API_KEY)
load_dotenv() 

# Import the fetch_shopping function from our shopping sub-agent module
from agents.sub_agents.shopping import fetch_shopping

# Define an asynchronous function to test our shopping agent
async def test_agent():
    # Print a message to the console indicating the start of the search process
    print("Searching for luxury shopping spots in New York City...")
    
    # Start a try-except block to safely catch and handle any potential errors
    try:
        # Await the asynchronous fetch_shopping function with sample arguments ("New York City", "luxury")
        results = await fetch_shopping("New York", "luxury")
        
        # Print a newline and the total number of results found by the agent
        print(f"\nFound {len(results)} results:")
        
        # Iterate over each attraction object in the returned results list
        for place in results:
            # Print the name of the current shopping spot
            print(f"- {place.name}")
            
            # Check if the object has an 'address' attribute and if it is not empty/None
            if hasattr(place, 'address') and place.address:
                # Print the address of the place with indentation for readability
                print(f"  Address: {place.address}")
            
    # Catch any exceptions (like API failures, missing keys, or parsing issues)
    except Exception as e:
        # Print the exact error message to the console
        print(f"\nError occurred: {e}")

# Check if this script is being run directly (and not imported as a module elsewhere)
if __name__ == "__main__":
    # Execute the asynchronous test_agent function using asyncio's event loop
    asyncio.run(test_agent())