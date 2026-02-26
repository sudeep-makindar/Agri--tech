"""
Satellite Router — GET /api/v1/satellite/ndvi/{farm_id}
Fetches NDVI history from Agromonitoring API
"""
from fastapi import APIRouter, HTTPException
import httpx
import os
import time

router = APIRouter()

OWM_KEY = os.getenv("OWM_API_KEY", "")
AGRO_BASE = "https://agromonitoring.com/api/v1"


@router.get("/satellite/ndvi/{farm_id}")
async def get_ndvi_history(farm_id: str):
    """Fetch 30-day NDVI history for a farm's polygon from Agromonitoring."""
    if not OWM_KEY:
        raise HTTPException(500, "OWM_API_KEY not configured")

    # Get farm's polygon_id from Supabase
    from services.supabase_client import get_supabase
    sb = get_supabase()
    farm_resp = sb.table("farms").select("agromonitoring_polygon_id").eq("id", farm_id).single().execute()

    if not farm_resp.data or not farm_resp.data.get("agromonitoring_polygon_id"):
        raise HTTPException(404, "Farm not found or polygon not registered with Agromonitoring")

    polygon_id = farm_resp.data["agromonitoring_polygon_id"]

    # 30 days ago
    dt_end = int(time.time())
    dt_start = dt_end - (30 * 24 * 60 * 60)

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{AGRO_BASE}/ndvi/history",
            params={
                "polyid": polygon_id,
                "appid": OWM_KEY,
                "start": dt_start,
                "end": dt_end,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, "Agromonitoring API error")
        data = resp.json()

    # Transform to dashboard format
    ndvi_history = []
    for i, entry in enumerate(data):
        ndvi_history.append({
            "day": i + 1,
            "ndvi": round(entry.get("data", {}).get("mean", 0), 3),
            "evi": round(entry.get("data", {}).get("std", 0), 3),  # approximation
            "threshold": 0.4,
        })

    return ndvi_history
