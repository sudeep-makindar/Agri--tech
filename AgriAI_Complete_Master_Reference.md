# AgriAI — Complete Master Reference
## Every API Key · Every ML Model · Every Dataset · Every Endpoint · Every Data Structure

---

# SECTION 1 — ALL API KEYS YOU NEED TO REGISTER

## 1.1 OpenWeatherMap (OWM)
```
Register at  : https://openweathermap.org/api
Keys needed  : 1 (your main API key)
.env var name: OWM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Free tier    : 1,000 calls/day
```
**Feeds these dashboard widgets:**
- `temp`, `humidity`, `rainfall`, `wind`, `pressure`, `uv` → MetricCards in Overview tab
- `soilMoisture` estimate → Overview + Farm Intel tab
- 7-day forecast → Risk Engine tab weather side
- `weather.wind`, `weather.rainfall` → goes INTO crop recommend model as features

**Two endpoints you'll actually call:**
```
Current weather:
GET https://api.openweathermap.org/data/2.5/weather
    ?lat={lat}&lon={lng}&appid={OWM_API_KEY}&units=metric

UV Index:
GET https://api.openweathermap.org/data/2.5/uvi
    ?lat={lat}&lon={lng}&appid={OWM_API_KEY}
```

**What comes back → what your dashboard uses:**
```
API returns                  Dashboard variable
─────────────────────────────────────────────
main.temp             →  weather.temp
main.humidity         →  weather.humidity
main.pressure         →  weather.pressure
wind.speed * 3.6      →  weather.wind  (m/s → km/h)
rain["1h"] or 0       →  weather.rainfall
weather[0].description→  weather.description
uvi (from UV endpoint)→  weather.uv
```

---

## 1.2 Agromonitoring (same OWM key — just different base URL)
```
Register at  : https://agromonitoring.com (uses your OWM_API_KEY)
Keys needed  : 0 extra — same OWM_API_KEY
Free tier    : 5 farm polygons, NDVI history free
```
**Feeds these dashboard widgets:**
- NDVI Stream chart in Overview tab  (`ndvi`, `evi` lines)
- Per-farm `ndvi` value in Farm Status Matrix table
- NDVI Time Series chart in Farm Intel tab

**Two endpoints you'll call:**
```
1. Register a farm polygon (do this ONCE per farm when user adds a farm):
POST https://agromonitoring.com/api/v1/polygons?appid={OWM_API_KEY}
Body: {
  "name": "farm_uuid",
  "geo_json": {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": [[ [lng1,lat1], [lng2,lat2], [lng3,lat3], [lng1,lat1] ]]
    }
  }
}
→ Returns: { "id": "polygon_id_string" }  ← SAVE THIS to farms table

2. Get NDVI history for a polygon:
GET https://agromonitoring.com/api/v1/ndvi/history
    ?polyid={polygon_id}&appid={OWM_API_KEY}
    &dtstart={unix_timestamp_30d_ago}&dtend={unix_timestamp_now}
```

**What comes back → what your dashboard uses:**
```
API returns                        Dashboard variable
──────────────────────────────────────────────────────
[{ dt, data: { mean, std } }]  →  ndviData array
data.mean                      →  ndvi (per day)
data.std                       →  evi (approximation)
dt (unix timestamp)            →  day number / date label
```

---

## 1.3 data.gov.in — Agmarknet (Mandi Prices)
```
Register at  : https://data.gov.in/user/register
Keys needed  : 1 (API key from your profile page after login)
.env var name: DATA_GOV_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Free tier    : Unlimited, completely free, Indian government open data
```
**Feeds these dashboard widgets:**
- Live Mandi Prices table in Market AI tab (`name`, `price`, `change%`, `vol`)
- Price Forecast base data (historical prices fed into ARIMA model)
- Market price change % calculation

**Endpoint:**
```
GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
    ?api-key={DATA_GOV_API_KEY}
    &format=json
    &limit=50
    &filters[State.Name]=Telangana
    &filters[Commodity]=Rice        ← optional filter
```
**Available commodity names (use exactly these strings):**
Rice, Wheat, Cotton, Maize, Soybean, Groundnut, Sugarcane, Turmeric

**What comes back → what your dashboard uses:**
```
API returns              Dashboard variable
──────────────────────────────────────────
Commodity           →  name (crop name)
Modal.Price         →  price (₹/quintal)
Min.Price           →  low
Max.Price           →  high
Arrival.Date        →  date
Market              →  market name
State               →  state
District            →  district
```
**Calculate change% yourself:**
```python
# Compare today's modal price vs yesterday's from your DB
change = ((today_price - yesterday_price) / yesterday_price) * 100
```

---

## 1.4 ISRIC SoilGrids (Soil Data)
```
Register at  : NOT REQUIRED — completely open API
Keys needed  : 0 — no API key, no registration
Base URL     : https://rest.isric.org
Free tier    : Unlimited
```
**Feeds these dashboard widgets:**
- Soil Radar Profile chart (N, P, K, pH, Organic Matter, Moisture)
- Soil Parameters progress bars
- Nutrient Trends line chart
- Goes INTO crop recommendation model as features (N, P, K, pH)

**Endpoint:**
```
GET https://rest.isric.org/soilgrids/v2.0/properties/query
    ?lon={lng}
    &lat={lat}
    &property=nitrogen
    &property=phh2o
    &property=soc
    &property=clay
    &property=sand
    &property=cec
    &depth=0-30cm
    &value=mean
```

**What comes back → what your dashboard uses:**
```
API returns                          Dashboard variable       Unit conversion
──────────────────────────────────────────────────────────────────────────────
nitrogen (g/kg × 100)          →  N value for radar     ÷ 1000 for mg/kg
phh2o (pH × 10)                →  pH for radar          ÷ 10 for real pH
soc (g/kg × 10)                →  Organic Matter        ÷ 10
clay (% × 10)                  →  Clay %                ÷ 10
sand (% × 10)                  →  Sand %                ÷ 10
cec (mmol/kg × 10)             →  soil health           ÷ 10

Normalize all to 0–100 scale for radar chart:
  N_normalized  = min(100, (nitrogen / 1000) * 2)
  P_normalized  = min(100, phosphorus_estimate * 2)  ← estimate, ISRIC has no direct P
  K_normalized  = min(100, potassium_estimate * 1.5) ← estimate
  pH_normalized = (phh2o / 10) * 12   (pH 0–8.5 → scaled to 100)
  OM_normalized = min(100, (soc / 10) * 5)
  moisture      = comes from OpenWeatherMap soil moisture or estimate
```

---

## 1.5 Supabase (Database + Auth + Storage + Realtime)
```
Register at  : https://supabase.com
Keys needed  : 3
.env vars:
  SUPABASE_URL         = https://xxxxxxxxxxxx.supabase.co
  SUPABASE_ANON_KEY    = eyJhbGci...  (safe to use in frontend)
  SUPABASE_SERVICE_KEY = eyJhbGci...  (NEVER put in frontend — backend only)

Frontend .env (Vite):
  VITE_SUPABASE_URL      = https://xxxxxxxxxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY = eyJhbGci...
```
**Where to find keys:** Supabase Dashboard → Project Settings → API

**Feeds these dashboard widgets:**
- Supabase Auth → user login/signup
- `farms` table → Farm Status Matrix (all 5 farms)
- `alerts` table → Alert Feed (real-time)
- `predictions` table → stores every ML model result
- `market_prices` table → historical prices for ARIMA training
- `ndvi_history` table → NDVI trends over time
- Supabase Storage → stores leaf images for disease detection

---

## 1.6 Upstash Redis (Caching)
```
Register at  : https://upstash.com
Keys needed  : 1 (connection URL)
.env var name: REDIS_URL=rediss://default:xxxxxxxx@xxxx.upstash.io:6380
Free tier    : 10,000 commands/day
```
**Used for:** Caching all external API responses so you don't hit rate limits
- Weather cache: 10 minutes TTL
- NDVI cache: 1 hour TTL
- Mandi prices cache: 1 hour TTL
- Soil data cache: 24 hours TTL (soil barely changes)

---

## 1.7 Complete .env Files

### Backend (backend/.env)
```env
# Weather & Satellite
OWM_API_KEY=your_openweathermap_key_here

# Market Data
DATA_GOV_API_KEY=your_data_gov_in_key_here

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cache
REDIS_URL=rediss://default:password@endpoint.upstash.io:6380

# App
ENVIRONMENT=development
PORT=8000
```

### Frontend (frontend/.env)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

# SECTION 2 — ALL ML MODELS

## MODEL 1 — Disease Detection CNN
```
Purpose      : Classify leaf disease from uploaded photo
Architecture : MobileNetV2 (transfer learning, fine-tuned)
Output file  : disease_model.keras  (~15MB)
Who trains   : Friend 1
Where to train: Google Colab (free T4 GPU, ~40 min)
Accuracy     : ~95%
```

### Dataset
```
Name    : PlantVillage Dataset
Size    : 54,306 images, 38 disease classes
Download: https://www.kaggle.com/datasets/emmarex/plantdisease
Format  : Folders organized as /PlantVillage/Tomato__Late_Blight/*.jpg
```

### The 38 Classes (what the model outputs)
```
Apple___Apple_scab              Corn___Common_rust
Apple___Black_rot               Corn___Northern_Leaf_Blight
Apple___Cedar_apple_rust        Corn___healthy
Apple___healthy                 Grape___Black_rot
Blueberry___healthy             Grape___Esca
Cherry___Powdery_mildew         Grape___Leaf_blight
Cherry___healthy                Grape___healthy
Corn___Cercospora_leaf_spot     Orange___Haunglongbing
Peach___Bacterial_spot          Tomato___Bacterial_spot
Peach___healthy                 Tomato___Early_blight
Pepper___Bacterial_spot         Tomato___Late_blight
Pepper___healthy                Tomato___Leaf_Mold
Potato___Early_blight           Tomato___Septoria_leaf_spot
Potato___Late_blight            Tomato___Spider_mites
Potato___healthy                Tomato___Target_Spot
Raspberry___healthy             Tomato___Tomato_mosaic_virus
Soybean___healthy               Tomato___Tomato_Yellow_Leaf_Curl_Virus
Squash___Powdery_mildew         Tomato___healthy
Strawberry___Leaf_scorch
Strawberry___healthy
```

### Endpoint
```
POST /api/v1/disease/detect
Content-Type: multipart/form-data
```

### Request Structure
```
Form field: file  (binary image — JPEG or PNG, max 5MB)
```

### Response Structure (JSON)
```json
{
  "disease": "Tomato — Late Blight",
  "confidence": 94.2,
  "severity": "Critical",
  "top3": [
    { "name": "Tomato — Late Blight",   "confidence": 94.2 },
    { "name": "Tomato — Early Blight",  "confidence":  4.1 },
    { "name": "Tomato — Healthy",       "confidence":  1.7 }
  ],
  "advisory": {
    "treatment": "Apply Metalaxyl + Mancozeb @ 2g/L. Spray every 7 days.",
    "prevention": "Avoid overhead irrigation. Use resistant varieties.",
    "severity": "Critical"
  }
}
```

### How the Dashboard Sends the Request (frontend code)
```javascript
// In Disease Scan tab — handleImageUpload function
const handleImageUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);           // <-- file from input[type=file] or drag-drop

  const response = await fetch(`${API_URL}/api/v1/disease/detect`, {
    method: 'POST',
    body: formData,
    // DO NOT set Content-Type header — browser sets it automatically with boundary
  });

  const result = await response.json();
  setDiseaseResult(result);
};
```

### How the Backend Receives and Runs It (FastAPI)
```python
@router.post("/api/v1/disease/detect")
async def detect_disease(file: UploadFile = File(...)):
    # 1. Validate
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Only JPEG/PNG")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, "Max 5MB")

    # 2. Store in Supabase Storage
    filename = f"{uuid4()}.jpg"
    supabase.storage.from_("leaf-images").upload(filename, contents)

    # 3. Run ML inference (Friend 1's function)
    result = disease_model.predict(contents)

    # 4. Save to predictions table
    supabase.table("predictions").insert({
        "feature_type": "disease",
        "input_data":  {"filename": filename, "content_type": file.content_type},
        "output_data": result
    }).execute()

    return result
```

---

## MODEL 2 — Crop Recommendation (Random Forest)
```
Purpose      : Recommend best 3 crops for a location based on soil + weather
Architecture : Random Forest Classifier (sklearn)
Output file  : crop_model.pkl + crop_label_encoder.pkl  (~2MB total)
Who trains   : Friend 2
Where to train: Any laptop — no GPU needed, trains in <10 seconds
Accuracy     : ~99%
```

### Dataset
```
Name    : Crop Recommendation Dataset
Size    : 2,200 rows, 8 columns
Download: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
Columns : N, P, K, temperature, humidity, ph, rainfall, label
Labels  : 22 crops (rice, wheat, maize, cotton, sugarcane, etc.)
```

### Endpoint
```
POST /api/v1/crop-recommend
Content-Type: application/json
```

### Request Structure (what frontend sends)
```json
{
  "lat": 17.1391,
  "lng": 78.2073
}
```
**That's it. The backend fetches N, P, K, temperature, humidity, ph, rainfall automatically from OWM + ISRIC using the coordinates.**

### What Backend Does Internally (the pipeline)
```
1. Receive lat/lng from frontend
2. Call OpenWeatherMap → get temperature, humidity, rainfall
3. Call ISRIC SoilGrids → get N, P, K, ph
4. Feed all 7 features into Random Forest model
5. Return top 3 crop recommendations
```

### Internal Feature Vector (what goes into the model)
```python
features = [[
    soil["N"],           # nitrogen (mg/kg), scaled 0-140
    soil["P"],           # phosphorus (mg/kg), scaled 0-145
    soil["K"],           # potassium (mg/kg), scaled 0-205
    weather["temp"],     # temperature in °C, e.g. 28.5
    weather["humidity"], # humidity in %, e.g. 71.0
    soil["ph"],          # pH 0-14, e.g. 6.5
    weather["rainfall"], # rainfall in mm, e.g. 202.9
]]
```

### Response Structure (JSON)
```json
{
  "recommendations": [
    { "rank": 1, "crop": "Rice",    "confidence": 87.3, "profit_estimate": "₹48,200/acre" },
    { "rank": 2, "crop": "Maize",   "confidence":  8.1, "profit_estimate": "₹31,600/acre" },
    { "rank": 3, "crop": "Soybean", "confidence":  3.2, "profit_estimate": "₹27,400/acre" }
  ],
  "inputs_used": {
    "N": 40, "P": 30, "K": 30,
    "temperature": 28.5, "humidity": 71.0,
    "ph": 6.5, "rainfall": 202.9
  },
  "location": { "lat": 17.1391, "lng": 78.2073 }
}
```

### How the Dashboard Sends the Request (frontend code)
```javascript
// In Market AI tab — when user clicks map or their location is detected
const fetchCropRecommendation = async (lat, lng) => {
  const response = await fetch(`${API_URL}/api/v1/crop-recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  });
  const result = await response.json();
  setCropRecommendations(result.recommendations);
  setInputsUsed(result.inputs_used);  // show N:40, P:30, K:30 badges in UI
};

// Trigger this when:
// 1. User's live location is detected (geolocation API)
// 2. User clicks a farm in the Farm Status Matrix
// 3. User clicks anywhere on the map
```

---

## MODEL 3 — Price Forecast (ARIMA)
```
Purpose      : Forecast crop market price for next 6 months
Architecture : ARIMA(1,1,1) from statsmodels
Output file  : No saved model file — fits on the fly from historical DB data
Who builds   : Friend 2
Where to run : Backend Python — no GPU needed
```

### No Training Dataset Needed Upfront
The ARIMA model fits dynamically using historical mandi price data that you collect daily from data.gov.in into your `market_prices` Supabase table. After 2–3 months of collection you'll have great data. For MVP, use the last 1 year of data from a Kaggle dataset:
```
Name    : Agricultural Commodity Prices India
Download: https://www.kaggle.com/datasets/kianwee/agricultural-raw-material-prices-1990-2020
Use     : Pre-populate your market_prices table with this historical data
```

### Endpoint
```
POST /api/v1/price-forecast
Content-Type: application/json
```

### Request Structure (what frontend sends)
```json
{
  "crop": "Rice",
  "state": "Telangana"
}
```

### Response Structure (JSON)
```json
{
  "crop": "Rice",
  "state": "Telangana",
  "current_price": 1920,
  "forecast": [
    { "month": "Mar", "price": 1945, "low": 1810, "high": 2090 },
    { "month": "Apr", "price": 1978, "low": 1820, "high": 2140 },
    { "month": "May", "price": 2010, "low": 1850, "high": 2180 },
    { "month": "Jun", "price": 1990, "low": 1800, "high": 2190 },
    { "month": "Jul", "price": 2045, "low": 1870, "high": 2230 },
    { "month": "Aug", "price": 2080, "low": 1900, "high": 2270 }
  ],
  "trend": "bullish",
  "model": "ARIMA(1,1,1)"
}
```

### How the Dashboard Sends the Request (frontend code)
```javascript
// In Market AI tab — when user clicks a crop button (Rice, Wheat, Cotton...)
const handleCropChange = async (cropName) => {
  setPriceCrop(cropName);
  const response = await fetch(`${API_URL}/api/v1/price-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop: cropName,
      state: userState || 'Telangana'  // from user profile or geolocation
    })
  });
  const result = await response.json();
  setPriceData(result.forecast);  // feeds directly into your ComposedChart
};
```

---

## MODEL 4 — Crop Failure Risk Score (XGBoost / Rule-based for MVP)
```
Purpose      : Score each farm's failure probability (0.0 to 1.0)
Architecture : Rule-based for MVP → upgrade to XGBoost after data collection
Output file  : risk_rules.py (no model file for rule-based MVP)
Who builds   : Friend 1
Where to run : Backend Python — no GPU needed
```

### No Training Dataset for MVP
Use rule-based scoring now. Train XGBoost later once you accumulate real farm prediction data in Supabase (3–6 months of predictions).

### Endpoint
```
POST /api/v1/early-warning/predict
Content-Type: application/json
Authorization: Bearer {supabase_jwt_token}
```

### Request Structure (what frontend sends)
```json
{
  "farm_id": "uuid-of-the-farm"
}
```

### What Backend Does Internally
```
1. Fetch farm record from Supabase (lat, lng, crop type, polygon_id)
2. Call OpenWeatherMap with farm lat/lng → get temp, rainfall_7d
3. Call Agromonitoring with polygon_id → get latest NDVI
4. Call ISRIC with farm lat/lng → get soil moisture estimate
5. Run risk scoring function with all 4 inputs
6. If risk_score > 0.7 → INSERT into alerts table → triggers Realtime to frontend
7. INSERT into predictions table (for history)
8. Return risk result
```

### Internal Feature Set (what goes into scorer)
```python
inputs = {
  "ndvi":               0.38,   # from Agromonitoring (0.0-1.0, <0.4 is bad)
  "soil_moisture":      22.0,   # from OWM or ISRIC estimate (%)
  "temperature":        36.5,   # from OWM (°C)
  "rainfall_7d":         3.2,   # sum of last 7 days rainfall from OWM (mm)
  "crop":               "Rice", # from farms table
  "growth_stage":       "Flowering"  # from farms table (user-set)
}
```

### Response Structure (JSON)
```json
{
  "farm_id": "uuid",
  "farm_name": "North Field Alpha",
  "risk_score": 0.74,
  "severity": "Critical",
  "flags": [
    "NDVI critically low (0.38 < threshold 0.40)",
    "Soil moisture deficit — 22% (optimal: 45-65% for Rice)",
    "Temperature stress — 36.5°C vs optimal 28°C for Rice"
  ],
  "recommendation": "Irrigate immediately. Apply foliar spray. Monitor for next 48h.",
  "inputs_used": {
    "ndvi": 0.38,
    "soil_moisture": 22.0,
    "temperature": 36.5,
    "rainfall_7d": 3.2
  }
}
```

### How the Dashboard Uses This (frontend)
```javascript
// Runs for every farm in the Farm Status Matrix
// Called every 1 hour via backend cron job
// Results stored in Supabase predictions table
// Frontend just reads from predictions table — doesn't call this endpoint directly

// But you can also call it on-demand when user clicks a farm:
const fetchRiskScore = async (farmId) => {
  const response = await fetch(`${API_URL}/api/v1/early-warning/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseSession.access_token}`
    },
    body: JSON.stringify({ farm_id: farmId })
  });
  const result = await response.json();
  // Update the farm's risk value in state
  setFarms(prev => prev.map(f =>
    f.id === farmId ? { ...f, risk: result.risk_score, flags: result.flags } : f
  ));
};
```

---

# SECTION 3 — SUPABASE SETUP (Auth + DB + Storage + Realtime)

## 3.1 Authentication Keys
```
Where to get : Supabase Dashboard → Project Settings → API
SUPABASE_URL         = https://abcdefghij.supabase.co
SUPABASE_ANON_KEY    = eyJ...  (public, safe in frontend)
SUPABASE_SERVICE_KEY = eyJ...  (secret, backend only — has admin access)
```

## 3.2 All Tables — Run This SQL in Supabase SQL Editor

```sql
-- ── PROFILES (extends auth.users) ──
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  role        TEXT DEFAULT 'farmer',  -- 'farmer' | 'enterprise' | 'admin'
  state       TEXT,
  district    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name) VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── FARMS ──
CREATE TABLE farms (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  crop                      TEXT,
  area_acres                FLOAT,
  location_lat              FLOAT,
  location_lng              FLOAT,
  soil_type                 TEXT,
  state                     TEXT,
  district                  TEXT,
  growth_stage              TEXT,
  polygon                   JSONB,         -- farm boundary coordinates
  agromonitoring_polygon_id TEXT,          -- from Agromonitoring API
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- ── PREDICTIONS (every ML inference result stored here) ──
CREATE TABLE predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id       UUID REFERENCES farms(id) ON DELETE CASCADE,
  feature_type  TEXT,      -- 'disease' | 'crop_rec' | 'risk' | 'price_forecast'
  input_data    JSONB,
  output_data   JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── ALERTS ──
CREATE TABLE alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     UUID REFERENCES farms(id) ON DELETE CASCADE,
  alert_type  TEXT,        -- 'Disease' | 'Weather' | 'Irrigation' | 'Market' | 'Risk'
  severity    TEXT,        -- 'Critical' | 'High' | 'Medium' | 'Low'
  message     TEXT,
  icon        TEXT,        -- emoji icon
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── MARKET PRICES (populated daily by cron job) ──
CREATE TABLE market_prices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name        TEXT,
  state            TEXT,
  district         TEXT,
  market           TEXT,
  price_per_quintal FLOAT,   -- modal price
  min_price        FLOAT,
  max_price        FLOAT,
  date             DATE,
  source           TEXT DEFAULT 'agmarknet'
);

-- ── NDVI HISTORY (populated daily by cron job) ──
CREATE TABLE ndvi_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     UUID REFERENCES farms(id) ON DELETE CASCADE,
  ndvi        FLOAT,
  evi         FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE farms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndvi_history ENABLE ROW LEVEL SECURITY;

-- Users only see their own data
CREATE POLICY "own farms"       ON farms        FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own predictions" ON predictions  FOR ALL USING (
  farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
);
CREATE POLICY "own alerts"      ON alerts       FOR ALL USING (
  farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
);
CREATE POLICY "market public"   ON market_prices FOR SELECT USING (true);
CREATE POLICY "own ndvi"        ON ndvi_history  FOR ALL USING (
  farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
);
```

## 3.3 Storage Buckets (create in Supabase Dashboard → Storage)
```
Bucket name : leaf-images
Public      : false
Max size    : 5MB per file
Allowed MIME: image/jpeg, image/png

Bucket name : satellite-tiles
Public      : false
Max size    : 20MB per file
```

## 3.4 Realtime Alerts (frontend subscription)
```javascript
// Add this to your main dashboard useEffect
// This replaces the static genAlerts() array

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// In your AgriAIDashboard component:
useEffect(() => {
  // Load existing alerts on mount
  const loadAlerts = async () => {
    const { data } = await supabase
      .from('alerts')
      .select('*, farms(name)')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    setAlerts(data.map(a => ({
      id: a.id,
      type: a.alert_type,
      farm: a.farms?.name || 'Unknown Farm',
      msg: a.message,
      sev: a.severity,
      time: timeAgo(a.created_at),  // helper: "2m ago"
      icon: a.icon
    })));
  };

  loadAlerts();

  // Subscribe to new alerts in real-time
  // This fires the moment your backend inserts into alerts table
  const channel = supabase
    .channel('alerts-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts'
    }, (payload) => {
      const newAlert = {
        id: payload.new.id,
        type: payload.new.alert_type,
        farm: 'Farm',
        msg: payload.new.message,
        sev: payload.new.severity,
        time: 'just now',
        icon: payload.new.icon
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

---

# SECTION 4 — COMPLETE DATA FLOW DIAGRAM

```
USER (browser)
     │
     ├─ Detects location via navigator.geolocation.getCurrentPosition()
     │         lat: 17.1391, lng: 78.2073
     │
     ▼
FRONTEND (React)
     │
     ├─── GET /api/v1/weather?lat=17.14&lng=78.21
     │         → temp, humidity, wind, pressure, rainfall, uv
     │         → feeds: 7 MetricCards in Overview
     │
     ├─── POST /api/v1/crop-recommend  { lat, lng }
     │         → internally calls OWM + ISRIC
     │         → feeds: ML Crop Synthesis cards in Market tab
     │
     ├─── POST /api/v1/price-forecast  { crop: "Rice", state: "Telangana" }
     │         → fits ARIMA on historical DB data
     │         → feeds: Price Forecast chart in Market tab
     │
     ├─── GET /api/v1/market/prices?state=Telangana
     │         → pulls from market_prices Supabase table (populated daily)
     │         → feeds: Live Mandi Prices table
     │
     ├─── GET /api/v1/satellite/ndvi/{farm_id}
     │         → calls Agromonitoring API
     │         → feeds: NDVI Stream chart, Farm Intel NDVI chart
     │
     ├─── GET /api/v1/soil?lat=17.14&lng=78.21
     │         → calls ISRIC SoilGrids
     │         → feeds: Soil Radar chart, Soil Parameters bars
     │
     ├─── POST /api/v1/disease/detect  (FormData with image file)
     │         → runs CNN inference on Friend 1's model
     │         → feeds: Disease result card, confidence %, advisory
     │
     ├─── POST /api/v1/early-warning/predict  { farm_id }
     │         → runs rule-based risk scoring
     │         → feeds: Risk bars in Farm Intel, Risk Engine charts
     │
     └─── Supabase Realtime subscription on alerts table
               → auto-updates Alert Feed as backend inserts new alerts
```

---

# SECTION 5 — LIVE LOCATION IMPLEMENTATION

```javascript
// Add this to AgriAIDashboard — replaces the static mapClick state

const [userLocation, setUserLocation] = useState({ lat: 17.1391, lng: 78.2073 });
const [locationGranted, setLocationGranted] = useState(false);
const [locationLoading, setLocationLoading] = useState(true);

useEffect(() => {
  if (!("geolocation" in navigator)) {
    setLocationLoading(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(coords);
      setLocationGranted(true);
      setLocationLoading(false);

      // Auto-fetch everything for user's real location
      await Promise.all([
        fetchWeather(coords.lat, coords.lng),
        fetchSoilData(coords.lat, coords.lng),
        fetchCropRecommendation(coords.lat, coords.lng),
      ]);
    },
    (error) => {
      console.warn("Location denied:", error.message);
      setLocationLoading(false);
      // Fall back to default Hyderabad coordinates — still fetch real data
      fetchWeather(17.1391, 78.2073);
      fetchSoilData(17.1391, 78.2073);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000  // use cached location if <5 min old
    }
  );
}, []);

// In your header, replace "All Nodes Online" area with:
// {locationGranted
//   ? <span style={{color:"#30d158"}}>📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
//   : <span style={{color:"#6b7a90"}}>📍 Default Location</span>
// }
```

---

# SECTION 6 — ALL BACKEND ENDPOINTS SUMMARY

| Method | Endpoint | Input | Output | ML Model Used |
|--------|----------|-------|--------|---------------|
| GET | `/api/v1/weather` | `?lat&lng` | weather object | None (OWM API) |
| GET | `/api/v1/soil` | `?lat&lng` | soil radar array | None (ISRIC API) |
| GET | `/api/v1/market/prices` | `?state&commodity` | prices array | None (Agmarknet) |
| GET | `/api/v1/satellite/ndvi/{farm_id}` | farm_id in path | ndvi history array | None (Agromonitoring) |
| POST | `/api/v1/crop-recommend` | `{lat, lng}` | recommendations array | Random Forest (Friend 2) |
| POST | `/api/v1/price-forecast` | `{crop, state}` | forecast array | ARIMA (Friend 2) |
| POST | `/api/v1/disease/detect` | FormData image file | disease + advisory | CNN MobileNetV2 (Friend 1) |
| POST | `/api/v1/early-warning/predict` | `{farm_id}` | risk score + flags | Rule-based → XGBoost (Friend 1) |
| GET | `/api/v1/early-warning/alerts` | JWT token | alerts array | None (Supabase) |
| POST | `/api/v1/farms` | farm details | created farm | None (Supabase) |
| GET | `/api/v1/farms` | JWT token | user's farms | None (Supabase) |

---

# SECTION 7 — WHAT EACH DASHBOARD VARIABLE MAPS TO

| Dashboard Variable | `genXxx()` function | Real Data Source | Endpoint |
|-------------------|--------------------|--------------------|----------|
| `weather.temp` | `genWeather()` | OpenWeatherMap | `GET /api/v1/weather` |
| `weather.humidity` | `genWeather()` | OpenWeatherMap | `GET /api/v1/weather` |
| `weather.rainfall` | `genWeather()` | OpenWeatherMap | `GET /api/v1/weather` |
| `weather.wind` | `genWeather()` | OpenWeatherMap | `GET /api/v1/weather` |
| `weather.uv` | `genWeather()` | OpenWeatherMap UV endpoint | `GET /api/v1/weather` |
| `weather.soilMoisture` | `genWeather()` | ISRIC / OWM estimate | `GET /api/v1/soil` |
| `weather.pressure` | `genWeather()` | OpenWeatherMap | `GET /api/v1/weather` |
| `farms[]` (all 5) | `genFarms()` | Supabase farms table | `GET /api/v1/farms` |
| `farms[].risk` | `genFarms()` | Risk scoring engine | `POST /api/v1/early-warning/predict` |
| `farms[].ndvi` | `genFarms()` | Agromonitoring API | `GET /api/v1/satellite/ndvi/{id}` |
| `farms[].moisture` | `genFarms()` | OpenWeatherMap / ISRIC | `GET /api/v1/weather` |
| `ndviData[]` (30 points) | `genNDVIHistory()` | Agromonitoring history | `GET /api/v1/satellite/ndvi/{id}` |
| `riskTrend[]` (7 days) | `genRiskTrend()` | predictions Supabase table | `GET /api/v1/early-warning/history/{id}` |
| `soilData[]` (radar) | `genSoilData()` | ISRIC SoilGrids | `GET /api/v1/soil` |
| `yieldData[]` (bar chart) | `genYieldHistory()` | predictions table aggregate | Supabase query |
| `irrigData[]` (14 days) | `genIrrigation()` | Rule-based on soil + weather | `GET /api/v1/land/irrigation-plan` |
| `alerts[]` | `genAlerts()` | Supabase alerts table + Realtime | Supabase subscription |
| `MARKET_DATA[]` | static array | Agmarknet data.gov.in | `GET /api/v1/market/prices` |
| `priceData[]` (forecast) | `genPriceForecast()` | ARIMA on market_prices table | `POST /api/v1/price-forecast` |
| Disease result | hardcoded | CNN MobileNetV2 | `POST /api/v1/disease/detect` |
| Crop Synthesis cards | hardcoded | Random Forest | `POST /api/v1/crop-recommend` |
| `liveLog[]` | simulated strings | Real FastAPI log stream | Server-Sent Events / WebSocket |

---

# SECTION 8 — QUICK CHECKLIST

### API Keys to Get Today
- [ ] OpenWeatherMap API key (free, instant)
- [ ] data.gov.in API key (free, need to register)
- [ ] Supabase project → 3 keys (URL + anon + service)
- [ ] Upstash Redis → connection URL

### Datasets to Download (Friend 1 + Friend 2)
- [ ] PlantVillage dataset — kaggle.com → Friend 1
- [ ] Crop Recommendation dataset — kaggle.com → Friend 2
- [ ] Agricultural prices historical CSV → kaggle.com → You (for Supabase seed)

### Models to Train
- [ ] Disease CNN → Google Colab T4 GPU → outputs disease_model.keras (Friend 1)
- [ ] Crop RF → Any laptop → outputs crop_model.pkl + encoder.pkl (Friend 2)
- [ ] ARIMA → No training, fits on the fly (Friend 2 writes the function)
- [ ] Risk scorer → Rule-based Python function (Friend 1 writes it)

### Files to Exchange Between Team Members
- [ ] Friend 1 → You: `disease_model.keras`, `class_names.json`, `disease_model.py`
- [ ] Friend 1 → You: `risk_model.py` (Python file with compute_risk_score function)
- [ ] Friend 2 → You: `crop_model.pkl`, `crop_label_encoder.pkl`, `crop_model.py`
- [ ] Friend 2 → You: `price_forecast.py` (Python file with forecast_price function)
- [ ] You → Everyone: `.env.template` file with all variable names (not values)

### Supabase Setup
- [ ] Run all SQL migrations (Section 3.2)
- [ ] Create leaf-images bucket
- [ ] Create satellite-tiles bucket
- [ ] Enable Realtime on alerts table (Supabase Dashboard → Database → Replication)
