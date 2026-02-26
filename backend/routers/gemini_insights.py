"""
Gemini Insights Router — GET /api/v1/insights/irrigation & /api/v1/insights/soil
Generates intelligent agricultural recommendations using Gemini API based on real-time environmental data.
"""
from fastapi import APIRouter, Query, HTTPException
import httpx
import os
import google.generativeai as genai
import json

router = APIRouter()

# Initialize Gemini
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# Reuse existing environmental fetchers if possible, but let's quickly fetch directly or import logic.
# For simplicity, we can just do a quick fetch to OWM/ISRIC right here to combine context for Gemini.

OWM_KEY = os.getenv("OWM_API_KEY", "")

async def get_context(lat: float, lng: float) -> dict:
    context = {"weather": "Unknown", "soil": "Unknown"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Weather fetch
            if OWM_KEY:
                w_resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"lat": lat, "lon": lng, "appid": OWM_KEY, "units": "metric"}
                )
                if w_resp.status_code == 200:
                    w = w_resp.json()
                    context["weather"] = f"Temp: {w.get('main', {}).get('temp')}C, Humidity: {w.get('main', {}).get('humidity')}%, Condition: {w.get('weather', [{}])[0].get('description')}"

            # Soil fetch
            s_resp = await client.get(
                "https://rest.isric.org/soilgrids/v2.0/properties/query",
                params={"lon": lng, "lat": lat, "property": ["nitrogen", "phh2o", "soc"], "depth": "0-30cm", "value": "mean"}
            )
            if s_resp.status_code == 200:
                s = s_resp.json()
                props = s.get("properties", {}).get("layers", [])
                soil_str = ""
                for p in props:
                    val = p.get("depths", [{}])[0].get("values", {}).get("mean")
                    soil_str += f"{p.get('name')}: {val} | "
                context["soil"] = soil_str or "ISRIC raw data unavailable"
    except Exception as e:
        print(f"Context fetch error: {e}")
    return context

@router.get("/insights/irrigation")
async def get_irrigation_insight(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    if not GEMINI_KEY:
        # Fallback Mock if Gemini key missing
        return {
            "status": "Mock Mode - Gemini Key Missing",
            "recommendation": "Maintain standard 15mm irrigation cycle at dawn.",
            "pump_status": "ONLINE",
            "water_saved": "120L expected"
        }

    context = await get_context(lat, lng)
    prompt = f"""
    You are an autonomous AI Irrigation Controller. 
    Location: Lat {lat}, Lng {lng}
    Current Weather: {context['weather']}
    Soil Data: {context['soil']}
    
    Return a strictly formatted JSON analyzing the irrigation needs. Do not use markdown backticks around the json.
    Structure:
    {{
        "pump_status": "ONLINE" or "STANDBY" or "URGENT_EVAC",
        "recommendation": "2-3 sentence technical description of watering action",
        "water_saved": "estimated liters saved today vs standard timer",
        "next_cycle": "time in hours"
    }}
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean any markdown formatting if present
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        return json.loads(text)
    except Exception as e:
        print("Gemini Irrigation Error:", e)
        raise HTTPException(500, "Failed to generate AI insight.")

@router.get("/insights/soil")
async def get_soil_insight(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    if not GEMINI_KEY:
        return {
            "status": "Mock Mode - Gemini Key Missing",
            "analysis": "Nitrogen slightly depleted. Recommend standard NPK mix.",
            "health_score": 75,
            "action_items": ["Apply generic fertilizer", "Test pH next month"]
        }

    context = await get_context(lat, lng)
    prompt = f"""
    You are an expert AI Agronomist analyzing deep soil telemetry. 
    Location: Lat {lat}, Lng {lng}
    Soil Data: {context['soil']}
    Weather Context: {context['weather']}
    
    Return a strictly formatted JSON analyzing the soil health. Do not use markdown backticks around the json.
    Structure:
    {{
        "health_score": <int 0-100>,
        "analysis": "2-3 sentence technical analysis of deep soil health based on ISRIC numbers",
        "action_items": ["Action 1", "Action 2", "Action 3"]
    }}
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        return json.loads(text)
    except Exception as e:
        print("Gemini Soil Error:", e)
        raise HTTPException(500, "Failed to generate AI insight.")
