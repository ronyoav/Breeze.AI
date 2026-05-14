import json
from utils.api_clients import tavily_search
from utils.llm import async_client, MODEL_HAIKU

SEARCH_TOOL = {
    "name": "search_web",
    "description": (
        "Search the web for real-time travel information. "
        "Use this to find venues, activities, restaurants, events, or any location-based data."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Specific search query to find relevant results",
            },
            "max_results": {
                "type": "integer",
                "description": "Number of results to return (default 8, max 10)",
            },
        },
        "required": ["query"],
    },
}


async def run_agent_loop(
    system_prompt: str,
    user_message: str,
    max_iterations: int = 3,
) -> str:
    """
    Agentic loop: Claude autonomously calls the Tavily search tool,
    processes results, and returns its final text response.
    """
    messages = [{"role": "user", "content": user_message}]

    for _ in range(max_iterations):
        response = await async_client.messages.create(
            model=MODEL_HAIKU,
            max_tokens=2048,
            system=system_prompt,
            tools=[SEARCH_TOOL],
            messages=messages,
        )

        if response.stop_reason != "tool_use":
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return "[]"

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                data = await tavily_search(
                    block.input.get("query", ""),
                    block.input.get("max_results", 8),
                )
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(data.get("results", [])),
                })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

    return "[]"
