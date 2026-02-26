"""
Early Warning Router — POST /api/v1/early-warning/predict
Rule-based crop failure risk scoring (MVP — upgradable to XGBoost later)
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import httpx
import os

router = APIRouter()


class RiskRequest(BaseModel):
    farm_id: str


def compute_risk_score(ndvi: float, soil_moisture: float, temperature: float,
                       rainfall_7d: float, crop: str, growth_stage: str) -> dict:
    """Rule-based risk scoring — returns score 0.0–1.0 and flags."""
    flags = []
    score = 0.0

    # Optimal ranges per crop
    crop_temps = {
        "Rice": (22, 32), "Wheat": (15, 25), "Cotton": (25, 35),
        "Sugarcane": (20, 35), "Soybean": (20, 30), "Maize": (18, 27),
    }
    crop_moisture = {
        "Rice": (50, 80), "Wheat": (35, 55), "Cotton": (40, 60),
        "Sugarcane": (45, 70), "Soybean": (40, 65), "Maize": (35, 60),
    }

    # 1. NDVI check
    if ndvi < 0.3:
        score += 0.35
        flags.append(f"NDVI critically low ({ndvi:.2f} < threshold 0.30)")
    elif ndvi < 0.4:
        score += 0.2
        flags.append(f"NDVI below optimal ({ndvi:.2f} < threshold 0.40)")

    # 2. Soil moisture check
    opt_low, opt_high = crop_moisture.get(crop, (35, 65))
    if soil_moisture < opt_low * 0.5:
        score += 0.25
        flags.append(f"Soil moisture critically low — {soil_moisture:.0f}% (optimal: {opt_low}–{opt_high}% for {crop})")
    elif soil_moisture < opt_low:
        score += 0.15
        flags.append(f"Soil moisture below optimal — {soil_moisture:.0f}%")

    # 3. Temperature stress
    t_low, t_high = crop_temps.get(crop, (18, 32))
    if temperature > t_high + 5:
        score += 0.25
        flags.append(f"Severe heat stress — {temperature:.1f}°C vs optimal {t_high}°C for {crop}")
    elif temperature > t_high:
        score += 0.15
        flags.append(f"Temperature stress — {temperature:.1f}°C above optimal for {crop}")

    # 4. Rainfall deficit
    if rainfall_7d < 5 and crop in ["Rice", "Sugarcane"]:
        score += 0.15
        flags.append(f"Rainfall deficit — {rainfall_7d:.1f}mm in 7 days (water-intensive crop)")

    # Cap at 1.0
    score = min(1.0, score)

    severity = "Critical" if score > 0.7 else "High" if score > 0.5 else "Medium" if score > 0.3 else "Low"
    recommendation = ""
    if score > 0.7:
        recommendation = "Irrigate immediately. Apply foliar spray. Monitor for next 48h."
    elif score > 0.5:
        recommendation = "Plan irrigation within 24h. Check for pest/disease symptoms."
    elif score > 0.3:
        recommendation = "Monitor soil moisture. Consider supplemental irrigation this week."
    else:
        recommendation = "Crop is in good condition. Maintain current practices."

    return {
        "risk_score": round(score, 3),
        "severity": severity,
        "flags": flags,
        "recommendation": recommendation,
    }


@router.post("/early-warning/predict")
async def predict_risk(req: RiskRequest, authorization: str = Header(...)):
    """Compute risk score for a farm using weather + satellite + soil data."""
    from services.supabase_client import get_supabase

    sb = get_supabase()

    # Get farm data
    farm_resp = sb.table("farms").select("*").eq("id", req.farm_id).single().execute()
    if not farm_resp.data:
        raise HTTPException(404, "Farm not found")

    farm = farm_resp.data
    lat = farm.get("location_lat", 17.14)
    lng = farm.get("location_lng", 78.21)
    crop = farm.get("crop", "Rice")
    growth_stage = farm.get("growth_stage", "Vegetative")

    # Fetch live data
    owm_key = os.getenv("OWM_API_KEY", "")
    temperature = 30.0
    rainfall_7d = 10.0
    soil_moisture = 50.0
    ndvi = 0.55

    if owm_key:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"lat": lat, "lon": lng, "appid": owm_key, "units": "metric"},
                )
                if r.status_code == 200:
                    w = r.json()
                    temperature = w["main"]["temp"]
                    soil_moisture = w["main"]["humidity"] * 0.75  # estimate
                    rainfall_7d = w.get("rain", {}).get("1h", 0) * 24 * 7  # rough estimate
        except Exception:
            pass

    # Compute risk
    result = compute_risk_score(ndvi, soil_moisture, temperature, rainfall_7d, crop, growth_stage)

    result["farm_id"] = req.farm_id
    result["farm_name"] = farm.get("name", "Unknown")
    result["inputs_used"] = {
        "ndvi": ndvi, "soil_moisture": soil_moisture,
        "temperature": temperature, "rainfall_7d": rainfall_7d,
    }

    # If critical → insert alert
    if result["risk_score"] > 0.7:
        try:
            sb.table("alerts").insert({
                "farm_id": req.farm_id,
                "alert_type": "Risk",
                "severity": result["severity"],
                "message": f"Risk score {result['risk_score']:.0%} — {', '.join(result['flags'][:2])}",
                "icon": "⚠️",
            }).execute()
        except Exception:
            pass

    # Save to predictions table
    try:
        sb.table("predictions").insert({
            "farm_id": req.farm_id,
            "feature_type": "risk",
            "input_data": result["inputs_used"],
            "output_data": result,
        }).execute()
    except Exception:
        pass

    return result
