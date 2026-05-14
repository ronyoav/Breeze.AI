import os
import json
from datetime import datetime
from typing import Any, Optional
from upstash_redis import Redis

_redis: Optional[Redis] = None
TTL = 60 * 60 * 48  # 48 hours


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis(
            url=os.environ["UPSTASH_REDIS_REST_URL"],
            token=os.environ["UPSTASH_REDIS_REST_TOKEN"],
        )
    return _redis


def _season() -> str:
    m = datetime.now().month
    if 3 <= m <= 5:
        return "spring"
    if 6 <= m <= 8:
        return "summer"
    if 9 <= m <= 11:
        return "autumn"
    return "winter"


def attraction_cache_key(city: str, category: str) -> str:
    return f"{city.lower().replace(' ', '-')}:{category}:{_season()}"


async def get_cached(key: str) -> Optional[Any]:
    try:
        value = get_redis().get(key)
        if value is None:
            return None
        return json.loads(value) if isinstance(value, str) else value
    except Exception:
        return None


async def set_cached(key: str, value: Any) -> None:
    try:
        get_redis().set(key, json.dumps(value), ex=TTL)
    except Exception:
        pass  # non-fatal
