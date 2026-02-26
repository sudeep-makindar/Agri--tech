"use client";
import React, { useState, useEffect } from "react";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from "recharts";
import { api } from "@/lib/api";

const TOOLTIP_STYLE = { background: "rgba(8,12,20,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#e0e8f0", fontSize: 11, backdropFilter: "blur(12px)" };
const CROPS = ["Cotton", "Rubber", "Copra", "Rice", "Wheat"];
const STATES = ["Tamil Nadu", "Telangana", "Maharashtra", "Kerala", "Karnataka", "Andhra Pradesh"];

export default function MarketPage() {
    const [priceCrop, setPriceCrop] = useState("Rice");
    const [regionState, setRegionState] = useState("Tamil Nadu");
    const [priceForecast, setPriceForecast] = useState<any>(null);
    const [marketPrices, setMarketPrices] = useState<any[]>([]);
    const [recommendation, setRecommendation] = useState<any>(null);
    const [loadingForecast, setLoadingForecast] = useState(false);
    const [loadingMarket, setLoadingMarket] = useState(false);
    const [loadingRec, setLoadingRec] = useState(false);
    const [lat, setLat] = useState(13.08);
    const [lng, setLng] = useState(80.27);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
            });
        }
    }, []);

    useEffect(() => { fetchMarketPrices(regionState); }, [regionState]);
    useEffect(() => { fetchForecast(priceCrop, regionState); }, [priceCrop, regionState]);

    const fetchMarketPrices = async (st: string) => {
        setLoadingMarket(true);
        try {
            const data = await api.marketPrices(st);
            setMarketPrices(Array.isArray(data) ? data.slice(0, 8) : []);
        } catch (e) { console.error(e); }
        finally { setLoadingMarket(false); }
    };

    const fetchForecast = async (crop: string, st: string) => {
        setLoadingForecast(true);
        try {
            const data = await api.priceForecast(crop, st);
            setPriceForecast(data);
        } catch (e) { console.error(e); setPriceForecast(null); }
        finally { setLoadingForecast(false); }
    };

    const handleRecommend = async () => {
        setLoadingRec(true);
        try { setRecommendation(await api.cropRecommend(lat, lng)); }
        catch { alert("Crop recommendation failed."); }
        finally { setLoadingRec(false); }
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <div className="animate-fade-up">
                <h1 className="text-2xl font-bold text-white mb-1">Market AI</h1>
                <p className="text-white/30 text-sm">ARIMA price forecasting & Random Forest crop synthesis</p>
            </div>

            {/* State Selector + Crop Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center animate-fade-up delay-1">
                <select value={regionState} onChange={e => setRegionState(e.target.value)} className="input-glass text-xs font-mono">
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex gap-2 flex-wrap">
                    {CROPS.map(c => (
                        <button key={c}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${priceCrop === c
                                ? "bg-gradient-to-r from-[rgba(0,229,255,0.15)] to-transparent border border-[rgba(0,229,255,0.3)] text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                                : "glass-sm text-white/30 hover:text-white/60"}`}
                            onClick={() => setPriceCrop(c)}
                        >{c}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">

                {/* ARIMA Chart */}
                <div className="glass rounded-2xl p-5 animate-fade-up delay-2">
                    <div className="text-white/80 font-semibold text-sm mb-1">{priceCrop} — Price Forecast</div>
                    <div className="text-white/20 text-[10px] font-mono mb-4">
                        {priceForecast ? priceForecast.model : "Loading model..."}
                    </div>
                    <div className="h-[240px] w-full">
                        {loadingForecast ? (
                            <div className="w-full h-full flex items-center justify-center text-[#fbbf24] font-mono text-xs animate-pulse">Running ARIMA(1,1,1)...</div>
                        ) : priceForecast?.forecast?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={priceForecast.forecast}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} />
                                    <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={((v: any) => v != null ? `₹${v}` : '') as any} />
                                    <Area type="monotone" dataKey="high" stroke="none" fill="rgba(52,211,153,0.1)" />
                                    <Area type="monotone" dataKey="low" stroke="none" fill="rgba(248,113,113,0.1)" />
                                    <Line type="monotone" dataKey="price" stroke="#00e5ff" strokeWidth={2} dot={{ r: 3, fill: "#00e5ff" }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/15 font-mono text-xs">No data for {priceCrop}</div>
                        )}
                    </div>
                </div>

                {/* Live Mandi Prices */}
                <div className="glass rounded-2xl p-5 animate-fade-up delay-3">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <div className="text-white/80 font-semibold text-sm">Live Mandi Prices</div>
                            <div className="text-white/20 text-[10px] font-mono">{regionState} — Agmarknet Feed</div>
                        </div>
                    </div>
                    {loadingMarket ? (
                        <div className="p-4 text-white/20 font-mono text-xs animate-pulse">Connecting to nodes...</div>
                    ) : marketPrices.length > 0 ? (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                            {marketPrices.map((m: any, i: number) => (
                                <div key={i} className="glass-sm rounded-xl p-3 flex justify-between items-center glass-hover">
                                    <div>
                                        <div className="text-white/70 text-xs font-medium">{m.name}</div>
                                        <div className="text-white/20 text-[10px] font-mono">{m.vol ? m.vol.toLocaleString() + " vol" : "..."}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[#fbbf24] text-sm font-bold font-mono">₹{m.price?.toLocaleString() || "N/A"}</div>
                                        <div style={{ color: (m.change || 0) >= 0 ? "#34d399" : "#f87171" }} className="text-[10px] font-mono">
                                            {(m.change || 0) >= 0 ? "▲" : "▼"}{Math.abs(m.change || 0)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-white/15 font-mono text-xs text-center p-8">No market data available</div>
                    )}
                </div>
            </div>

            {/* ML Crop Synthesis */}
            <div className="glass rounded-2xl p-6 animate-fade-up delay-4">
                <div className="text-white/80 font-semibold text-sm mb-1">Predictive Crop Synthesis</div>
                <div className="text-white/20 text-[10px] font-mono mb-5">Random Forest powered by ISRIC SoilGrids & OWM Weather</div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-sm rounded-xl p-5">
                        <div className="text-[#00e5ff] text-[10px] tracking-widest font-mono mb-4">GEOLOCATION INPUT</div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <input type="number" step="0.01" value={lat} onChange={e => setLat(+e.target.value)} className="input-glass text-xs font-mono" placeholder="Latitude" />
                            <input type="number" step="0.01" value={lng} onChange={e => setLng(+e.target.value)} className="input-glass text-xs font-mono" placeholder="Longitude" />
                        </div>
                        <button onClick={handleRecommend} disabled={loadingRec} className="btn-glass w-full disabled:opacity-40">
                            {loadingRec ? "PROCESSING..." : "🌱 EXECUTE ML SYNTHESIS"}
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        {recommendation?.top_3 ? (
                            recommendation.top_3.map((r: any, i: number) => (
                                <div key={i} className={`glass-sm rounded-xl p-4 flex items-center gap-4 ${i === 0 ? 'border border-[rgba(0,229,255,0.15)]' : ''}`}>
                                    <div className={`text-xl font-bold font-mono ${i === 0 ? 'text-[#fbbf24]' : 'text-white/15'}`}>#{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="text-white/80 text-sm font-bold uppercase">{r.crop_name}</div>
                                        <div className="text-white/20 text-[10px] font-mono">Suitability</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[#34d399] text-sm font-bold font-mono">{(r.probability * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="glass-sm rounded-xl p-8 flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="text-3xl opacity-15 mb-2">🌱</div>
                                    <div className="text-white/15 font-mono text-xs">Awaiting geolocation vector</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
