"""
Market Router — GET /api/v1/market/prices
Fetches mandi prices from local Kaggle CSV dataset
"""
from fastapi import APIRouter, Query, HTTPException
import os
import pandas as pd

router = APIRouter()

CSV_PATH = r"d:\11-11\Agriculture_price_dataset.csv"

# Cache for the loaded dataframe to prevent reading it on every request
_df = None

def get_market_data():
    global _df
    if _df is None:
        if not os.path.exists(CSV_PATH):
            raise FileNotFoundError(f"Market dataset not found at {CSV_PATH}")
        _df = pd.read_csv(CSV_PATH)
        # Convert date to datetime for easier sorting/filtering
        _df['Price Date'] = pd.to_datetime(_df['Price Date'], format='%d/%m/%Y', errors='coerce')
    return _df


@router.get("/market/prices")
async def get_market_prices(
    state: str = Query("Telangana", description="State name"),
    commodity: str = Query(None, description="Optional crop filter"),
):
    """Fetch mandi prices from local CSV dataset."""
    try:
        df = get_market_data()
    except Exception as e:
        raise HTTPException(500, str(e))

    # Filter by state (case-insensitive)
    mask = df['STATE'].str.lower() == state.lower()
    
    if commodity:
        mask = mask & (df['Commodity'].str.lower() == commodity.lower())
        
    filtered = df[mask]
    
    # Group by commodity, take latest price per crop
    # Sort by date descending so the first one we see is the latest
    filtered = filtered.sort_values(by='Price Date', ascending=False)
    
    crop_map = {}
    for _, row in filtered.iterrows():
        name = row['Commodity']
        if pd.isna(name): continue
        
        price = float(row['Modal_Price']) if pd.notna(row['Modal_Price']) else 0.0
        min_p = float(row['Min_Price']) if pd.notna(row['Min_Price']) else 0.0
        max_p = float(row['Max_Price']) if pd.notna(row['Max_Price']) else 0.0

        if name not in crop_map and price > 0:
            crop_map[name] = {
                "name": name,
                "price": price,
                "change": 0,  
                "vol": 0,
                "low": min_p,
                "high": max_p,
            }

    # If no data found for the state (e.g. Telangana might not be in the mock dataset),
    # return some defaults from another state just so the UI isn't empty MVP
    if not crop_map and state.lower() == "telangana":
        return await get_market_prices(state="Maharashtra", commodity=commodity)

    return list(crop_map.values())
