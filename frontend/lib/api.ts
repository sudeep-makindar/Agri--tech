/**
 * AgriAI API Client
 * Typed fetch helpers for all backend endpoints
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.text().catch(() => "Unknown error");
        throw new Error(`API Error ${res.status}: ${err}`);
    }
    return res.json();
}

export const api = {
    // ── Weather ──
    weather: (lat: number, lng: number) =>
        fetchJSON(`${BASE}/weather?lat=${lat}&lng=${lng}`),

    // ── Soil ──
    soil: (lat: number, lng: number) =>
        fetchJSON(`${BASE}/soil?lat=${lat}&lng=${lng}`),

    // ── Market Prices ──
    marketPrices: (state = "Telangana", commodity?: string) => {
        const params = new URLSearchParams({ state });
        if (commodity) params.set("commodity", commodity);
        return fetchJSON(`${BASE}/market/prices?${params}`);
    },

    // ── Satellite NDVI ──
    ndvi: (farmId: string) =>
        fetchJSON(`${BASE}/satellite/ndvi/${farmId}`),

    // ── Farms ──
    farms: (token: string) =>
        fetchJSON(`${BASE}/farms`, {
            headers: { Authorization: `Bearer ${token}` },
        }),

    createFarm: (farm: Record<string, unknown>, token: string) =>
        fetchJSON(`${BASE}/farms`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(farm),
        }),

    // ── Crop Recommendation ──
    cropRecommend: (lat: number, lng: number) =>
        fetchJSON(`${BASE}/crop-recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
        }),

    // ── Price Forecast ──
    priceForecast: (crop: string, state = "Telangana") =>
        fetchJSON(`${BASE}/price-forecast`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crop, state }),
        }),

    // ── Disease Detection ──
    diseaseDetect: (file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        return fetchJSON(`${BASE}/disease/detect`, { method: "POST", body: fd });
    },

    // ── Early Warning / Risk ──
    riskPredict: (farmId: string, token: string) =>
        fetchJSON(`${BASE}/early-warning/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ farm_id: farmId }),
        }),

    // ── Gemini AI Insights ──
    geminiIrrigation: (lat: number, lng: number) =>
        fetchJSON(`${BASE}/insights/irrigation?lat=${lat}&lng=${lng}`),

    geminiSoil: (lat: number, lng: number) =>
        fetchJSON(`${BASE}/insights/soil?lat=${lat}&lng=${lng}`),
};
