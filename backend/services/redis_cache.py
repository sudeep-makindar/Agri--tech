"""
Redis Cache Service — Caches external API responses to protect rate limits
"""
import os
import json
from typing import Optional

_redis = None


def get_redis():
    """Get Redis client (lazy init)."""
    global _redis
    if _redis is None:
        redis_url = os.getenv("REDIS_URL", "")
        if not redis_url:
            return None
        try:
            import redis
            _redis = redis.from_url(redis_url, decode_responses=True)
            _redis.ping()
        except Exception:
            _redis = None
    return _redis


def cache_get(key: str) -> Optional[dict]:
    """Get cached value by key."""
    r = get_redis()
    if r is None:
        return None
    try:
        val = r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


def cache_set(key: str, value: dict, ttl_seconds: int = 600):
    """Set cached value with TTL."""
    r = get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl_seconds, json.dumps(value))
    except Exception:
        pass
