import json
from utils.api_clients import tavily_search
from utils.tools import fetch_image_url
from utils.llm import async_client, MODEL_HAIKU

async def run_agent_loop(
    system_prompt: str,
    user_message: str,
    tools: list,
    max_iterations: int = 4,
) -> str:
    """
    Agentic loop: Claude autonomously calls the provided tools,
    processes results, and returns its final text response.
    """
    messages = [{"role": "user", "content": user_message}]

    for _ in range(max_iterations):
        response = await async_client.messages.create(
            model=MODEL_HAIKU,
            max_tokens=2048,
            system=system_prompt,
            tools=tools,
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
                if block.name == "search_web":
                    data = await tavily_search(
                        block.input.get("query", ""),
                        block.input.get("max_results", 8),
                    )
                    content_str = json.dumps(data.get("results", []))
                elif block.name == "duckduckgo_image":
                    url = await fetch_image_url(block.input.get("query", ""))
                    content_str = json.dumps({"image_url": url})
                else:
                    content_str = json.dumps({"error": f"Unknown tool: {block.name}"})

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": content_str,
                })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

    return "[]"
