"""
Soil Router — GET /api/v1/soil
Fetches soil data from ISRIC SoilGrids (no API key needed)
"""
from fastapi import APIRouter, Query, HTTPException
import httpx

router = APIRouter()

ISRIC_BASE = "https://rest.isric.org/soilgrids/v2.0/properties/query"


@router.get("/soil")
async def get_soil(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    """Fetch soil properties from ISRIC SoilGrids — normalize to 0–100 for radar chart."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            ISRIC_BASE,
            params={
                "lon": lng,
                "lat": lat,
                "property": ["nitrogen", "phh2o", "soc", "clay", "sand", "cec"],
                "depth": "0-30cm",
                "value": "mean",
            },
        )
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, "ISRIC SoilGrids API error")
        data = resp.json()

    # Parse properties from the response
    properties = {}
    for layer in data.get("properties", {}).get("layers", []):
        prop_name = layer.get("name", "")
        depths = layer.get("depths", [])
        if depths:
            val = depths[0].get("values", {}).get("mean")
            properties[prop_name] = val

    # Normalize to 0–100 scale for radar chart
    nitrogen_raw = properties.get("nitrogen", 0) or 0
    ph_raw = properties.get("phh2o", 0) or 0
    soc_raw = properties.get("soc", 0) or 0

    n_normalized = min(100, (nitrogen_raw / 1000) * 2)
    p_normalized = min(100, n_normalized * 0.6)  # estimate (ISRIC has no direct P)
    k_normalized = min(100, n_normalized * 0.8)  # estimate
    ph_normalized = min(100, (ph_raw / 10) * 12)
    om_normalized = min(100, (soc_raw / 10) * 5)
    moisture_estimate = min(100, om_normalized * 1.2)

    return [
        {"subject": "N (Nitrogen)", "A": round(n_normalized), "fullMark": 100},
        {"subject": "P (Phosphorus)", "A": round(p_normalized), "fullMark": 100},
        {"subject": "K (Potassium)", "A": round(k_normalized), "fullMark": 100},
        {"subject": "pH Level", "A": round(ph_normalized), "fullMark": 100},
        {"subject": "Organic Matter", "A": round(om_normalized), "fullMark": 100},
        {"subject": "Moisture", "A": round(moisture_estimate), "fullMark": 100},
    ]
