import os
from anthropic import Anthropic, AsyncAnthropic
from langsmith.wrappers import wrap_anthropic

# OpenRouter configuration using the Anthropic SDK
OPENROUTER_BASE_URL = "https://openrouter.ai/api"
API_KEY = os.getenv("API_KEY_LLM")

# Sync client (for existing code like orchestrator.py)
# Wrapped with LangSmith for automatic tracing!
client = wrap_anthropic(Anthropic(
    base_url=OPENROUTER_BASE_URL,
    api_key=API_KEY
))

# Async client (recommended for new sub-agents for better performance)
# Wrapped with LangSmith for automatic tracing!
async_client = wrap_anthropic(AsyncAnthropic(
    base_url=OPENROUTER_BASE_URL,
    api_key=API_KEY
))

# OpenRouter model strings
# Note: OpenRouter requires the "provider/" prefix for models
MODEL_HAIKU = "anthropic/claude-3-5-haiku-20241022"