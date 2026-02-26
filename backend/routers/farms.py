"""
Farms Router — GET/POST /api/v1/farms
CRUD for user's farms via Supabase
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import httpx
import os

router = APIRouter()


class FarmCreate(BaseModel):
    name: str
    crop: Optional[str] = None
    area_acres: Optional[float] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    soil_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    growth_stage: Optional[str] = None
    polygon: Optional[dict] = None


def _get_user_id(token: str) -> str:
    """Extract user ID from Supabase JWT."""
    from services.supabase_client import get_supabase
    sb = get_supabase()
    user = sb.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(401, "Invalid token")
    return user.user.id


@router.get("/farms")
async def list_farms(authorization: str = Header(...)):
    """List all farms belonging to the authenticated user."""
    token = authorization.replace("Bearer ", "")
    user_id = _get_user_id(token)

    from services.supabase_client import get_supabase
    sb = get_supabase()
    resp = sb.table("farms").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return resp.data


@router.post("/farms")
async def create_farm(farm: FarmCreate, authorization: str = Header(...)):
    """Create a new farm for the authenticated user."""
    token = authorization.replace("Bearer ", "")
    user_id = _get_user_id(token)

    from services.supabase_client import get_supabase
    sb = get_supabase()

    farm_data = farm.model_dump(exclude_none=True)
    farm_data["user_id"] = user_id

    # Register polygon with Agromonitoring if polygon coordinates provided
    if farm.polygon and farm.location_lat and farm.location_lng:
        try:
            polygon_id = await _register_agromonitoring_polygon(farm)
            farm_data["agromonitoring_polygon_id"] = polygon_id
        except Exception:
            pass  # non-critical — farm still created without NDVI tracking

    resp = sb.table("farms").insert(farm_data).execute()
    return resp.data[0] if resp.data else resp.data


async def _register_agromonitoring_polygon(farm: FarmCreate) -> str:
    """Register farm boundary with Agromonitoring API and return polygon_id."""
    owm_key = os.getenv("OWM_API_KEY", "")
    if not owm_key:
        raise Exception("No OWM key")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"https://agromonitoring.com/api/v1/polygons?appid={owm_key}",
            json={
                "name": farm.name,
                "geo_json": {
                    "type": "Feature",
                    "properties": {},
                    "geometry": farm.polygon,
                },
            },
        )
        if resp.status_code == 201:
            return resp.json().get("id", "")
    raise Exception("Agromonitoring registration failed")
