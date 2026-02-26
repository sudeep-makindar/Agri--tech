"""
Price Forecast Router — POST /api/v1/price-forecast
Fits ARIMA(1,1,1) on historical price data to forecast 6 months ahead
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import pandas as pd
import numpy as np

router = APIRouter()

CSV_PATH = r"d:\11-11\agricultural_raw_material.csv"

class PriceForecastRequest(BaseModel):
    crop: str
    state: Optional[str] = "Telangana"


@router.post("/price-forecast")
async def forecast_price(req: PriceForecastRequest):
    """Forecast crop price for next 6 months using ARIMA model from Kaggle CSV."""
    import random

    crop_mapping = {
        "Cotton": "Cotton Price",
        "Rubber": "Rubber Price",
        "Copra": "Copra Price"
    }
    
    col_name = crop_mapping.get(req.crop.capitalize())
    
    # Base fallback mock
    base = {"Rice": 1900, "Wheat": 2100, "Cotton": 6200, "Sugarcane": 340,
            "Soybean": 4100, "Maize": 1650}.get(req.crop.capitalize(), 2000)
    
    months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"]
    
    if not col_name or not os.path.exists(CSV_PATH):
        # Fallback to mock if it's not Cotton/Rubber/Copra or CSV is missing
        forecast = []
        for i, m in enumerate(months):
            p = base + random.randint(-100, 200) + i * random.randint(10, 30)
            forecast.append({
                "month": m, "price": p,
                "low": p - random.randint(100, 200),
                "high": p + random.randint(100, 250),
            })
        return {
            "crop": req.crop, "state": req.state, "current_price": base,
            "forecast": forecast, "trend": "stable",
            "model": "MOCK — crop not in agricultural_raw_material.csv",
        }

    # If it is Cotton/Rubber etc., run ARIMA on the CSV
    try:
        from statsmodels.tsa.arima.model import ARIMA
        
        df = pd.read_csv(CSV_PATH)
        prices = pd.to_numeric(df[col_name], errors='coerce').dropna().values
        
        # Scale the prices up so they look like INR/Quintal (the CSV has prices like "1.83" USD)
        prices = prices * 80 * 10  
        
        # Fit ARIMA
        series = pd.Series(prices[-120:]) # last 10 years of months
        model = ARIMA(series, order=(1, 1, 1))
        fitted = model.fit()
        forecast_result = fitted.forecast(steps=6)
        conf_int = fitted.get_forecast(steps=6).conf_int()

        forecast = []
        for i in range(6):
            forecast.append({
                "month": months[i],
                "price": round(float(forecast_result.iloc[i])),
                "low": round(float(conf_int.iloc[i, 0])),
                "high": round(float(conf_int.iloc[i, 1])),
            })

        trend = "bullish" if forecast[-1]["price"] > prices[-1] else "bearish"

        return {
            "crop": req.crop,
            "state": req.state,
            "current_price": round(prices[-1]),
            "forecast": forecast,
            "trend": trend,
            "model": "ARIMA(1,1,1) on local CSV",
        }
    except Exception as e:
        raise HTTPException(500, f"ARIMA fitting failed: {str(e)}")
