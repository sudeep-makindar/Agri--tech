"""
Crop Recommendation Router — POST /api/v1/crop-recommend
Runs Random Forest classifier on soil + weather features
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json

router = APIRouter()

# ML model — loaded lazily
_model = None
_encoder = None

PROFIT_ESTIMATES = {
    "rice": "₹48,200/acre", "wheat": "₹35,800/acre", "maize": "₹31,600/acre",
    "cotton": "₹42,100/acre", "sugarcane": "₹55,000/acre", "soybean": "₹27,400/acre",
    "groundnut": "₹38,900/acre", "turmeric": "₹62,000/acre", "coffee": "₹45,000/acre",
    "jute": "₹22,500/acre", "lentil": "₹28,000/acre", "mango": "₹55,000/acre",
}


class CropRequest(BaseModel):
    lat: float
    lng: float


def _load_model():
    global _model, _encoder
    model_path = os.path.join(os.path.dirname(__file__), "..", "ml_models", "crop_model.pkl")
    encoder_path = os.path.join(os.path.dirname(__file__), "..", "ml_models", "crop_label_encoder.pkl")

    if not os.path.exists(model_path):
        return None, None
    try:
        import joblib
        _model = joblib.load(model_path)
        if os.path.exists(encoder_path):
            _encoder = joblib.load(encoder_path)
        return _model, _encoder
    except Exception as e:
        print(f"Failed to load crop model: {e}")
        return None, None


@router.post("/crop-recommend")
async def recommend_crop(req: CropRequest):
    """Recommend top-3 crops for a location based on soil + weather features."""
    import httpx

    owm_key = os.getenv("OWM_API_KEY", "")

    # 1. Fetch weather data
    weather = {"temp": 28.5, "humidity": 71.0, "rainfall": 202.9}
    if owm_key:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"lat": req.lat, "lon": req.lng, "appid": owm_key, "units": "metric"},
                )
                if r.status_code == 200:
                    w = r.json()
                    weather = {
                        "temp": w["main"]["temp"],
                        "humidity": w["main"]["humidity"],
                        "rainfall": w.get("rain", {}).get("1h", 0) * 24 * 30,  # rough monthly est
                    }
        except Exception:
            pass

    # 2. Fetch soil data
    soil = {"N": 40, "P": 30, "K": 30, "ph": 6.5}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                "https://rest.isric.org/soilgrids/v2.0/properties/query",
                params={
                    "lon": req.lng, "lat": req.lat,
                    "property": ["nitrogen", "phh2o"],
                    "depth": "0-30cm", "value": "mean",
                },
            )
            if r.status_code == 200:
                layers = r.json().get("properties", {}).get("layers", [])
                for l in layers:
                    val = l.get("depths", [{}])[0].get("values", {}).get("mean", 0) or 0
                    if l["name"] == "nitrogen":
                        soil["N"] = min(140, val / 10)
                    elif l["name"] == "phh2o":
                        soil["ph"] = round(val / 10, 1)
    except Exception:
        pass

    inputs_used = {
        "N": soil["N"], "P": soil["P"], "K": soil["K"],
        "temperature": weather["temp"], "humidity": weather["humidity"],
        "ph": soil["ph"], "rainfall": weather["rainfall"],
    }

    # 3. Run ML model
    model, encoder = _load_model()
    if model is None:
        # Fallback recommendations when model not loaded
        return {
            "recommendations": [
                {"rank": 1, "crop": "Rice", "confidence": 87.3, "profit_estimate": "₹48,200/acre"},
                {"rank": 2, "crop": "Maize", "confidence": 8.1, "profit_estimate": "₹31,600/acre"},
                {"rank": 3, "crop": "Soybean", "confidence": 3.2, "profit_estimate": "₹27,400/acre"},
            ],
            "inputs_used": inputs_used,
            "location": {"lat": req.lat, "lng": req.lng},
            "model_status": "NOT_LOADED — place crop_model.pkl in ml_models/",
        }

    import numpy as np
    features = np.array([[
        inputs_used["N"], inputs_used["P"], inputs_used["K"],
        inputs_used["temperature"], inputs_used["humidity"],
        inputs_used["ph"], inputs_used["rainfall"],
    ]])

    probas = model.predict_proba(features)[0]
    top3_idx = probas.argsort()[-3:][::-1]
    classes = encoder.classes_ if encoder else model.classes_

    recommendations = []
    for rank, idx in enumerate(top3_idx, 1):
        crop = classes[idx]
        recommendations.append({
            "rank": rank,
            "crop": crop.capitalize(),
            "confidence": round(float(probas[idx]) * 100, 1),
            "profit_estimate": PROFIT_ESTIMATES.get(crop.lower(), "₹30,000/acre"),
        })

    return {
        "recommendations": recommendations,
        "inputs_used": inputs_used,
        "location": {"lat": req.lat, "lng": req.lng},
    }
