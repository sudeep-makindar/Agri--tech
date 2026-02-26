"""
AgriAI Backend — FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import weather, soil, satellite, market, farms, disease, crop_recommend, price_forecast, early_warning, gemini_insights

app = FastAPI(
    title="AgriAI API",
    description="Neural Agricultural Intelligence Platform — Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev server
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(weather.router,        prefix="/api/v1", tags=["Weather"])
app.include_router(soil.router,           prefix="/api/v1", tags=["Soil"])
app.include_router(satellite.router,      prefix="/api/v1", tags=["Satellite"])
app.include_router(market.router,         prefix="/api/v1", tags=["Market"])
app.include_router(farms.router,          prefix="/api/v1", tags=["Farms"])
app.include_router(disease.router,        prefix="/api/v1", tags=["Disease Detection"])
app.include_router(crop_recommend.router, prefix="/api/v1", tags=["Crop Recommendation"])
app.include_router(price_forecast.router, prefix="/api/v1", tags=["Price Forecast"])
app.include_router(early_warning.router,  prefix="/api/v1", tags=["Early Warning"])
app.include_router(gemini_insights.router, prefix="/api/v1", tags=["Gemini AI Insights"])


@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "online",
        "service": "AgriAI API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
