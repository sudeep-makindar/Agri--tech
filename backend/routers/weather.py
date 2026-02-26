"""
Weather Router — GET /api/v1/weather
Fetches current weather from OpenWeatherMap API
"""
from fastapi import APIRouter, Query, HTTPException
import httpx
import os

router = APIRouter()

OWM_KEY = os.getenv("OWM_API_KEY", "")
OWM_BASE = "https://api.openweathermap.org/data/2.5"


@router.get("/weather")
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    """Fetch current weather + UV index for coordinates."""
    if not OWM_KEY:
        raise HTTPException(500, "OWM_API_KEY not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        # Current weather
        weather_resp = await client.get(
            f"{OWM_BASE}/weather",
            params={"lat": lat, "lon": lng, "appid": OWM_KEY, "units": "metric"},
        )
        if weather_resp.status_code != 200:
            raise HTTPException(weather_resp.status_code, "OpenWeatherMap API error")
        w = weather_resp.json()

        # UV Index
        uv_resp = await client.get(
            f"{OWM_BASE}/uvi",
            params={"lat": lat, "lon": lng, "appid": OWM_KEY},
        )
        uv_val = uv_resp.json().get("value", 0) if uv_resp.status_code == 200 else 0

    return {
        "temp": w["main"]["temp"],
        "humidity": w["main"]["humidity"],
        "pressure": w["main"]["pressure"],
        "wind": round(w["wind"]["speed"] * 3.6, 1),  # m/s → km/h
        "rainfall": w.get("rain", {}).get("1h", 0),
        "uv": uv_val,
        "soilMoisture": round(w["main"]["humidity"] * 0.75, 1),  # estimate
        "description": w["weather"][0]["description"] if w.get("weather") else "",
        "location": {"lat": lat, "lng": lng},
    }
