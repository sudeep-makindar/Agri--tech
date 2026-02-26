"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function SoilPage() {
    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(false);
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

    const handleRunAnalysis = async () => {
        setLoading(true);
        setInsight(null);
        try {
            const data = await api.geminiSoil(lat, lng);
            setInsight(data);
        } catch (e) {
            console.error(e);
            alert("Gemini Integration Failed. Make sure GEMINI_API_KEY is set in backend .env");
        } finally {
            setLoading(false);
        }
    };

    const healthColor = insight ? (Number(insight.health_score) > 75 ? '#34d399' : Number(insight.health_score) > 50 ? '#fbbf24' : '#f87171') : '#00e5ff';

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="animate-fade-up">
                <h1 className="text-2xl font-bold text-white mb-1">Soil Matrix Analyzer</h1>
                <p className="text-white/30 text-sm">ISRIC 250m resolution soil data + Gemini 2.5 Flash AI analysis</p>
            </div>

            {!insight && !loading ? (
                <div className="glass rounded-2xl p-8 text-center animate-fade-up delay-1">
                    <div className="text-6xl mb-6 animate-float">🔬</div>
                    <div className="text-white/80 font-semibold text-lg mb-2">Ready to Analyze</div>
                    <div className="text-white/25 text-sm mb-8 max-w-md mx-auto">
                        Enter your GPS coordinates to initiate deep soil composition analysis powered by Gemini AI
                    </div>
                    <div className="flex gap-4 justify-center mb-6">
                        <input type="number" step="0.01" value={lat} onChange={e => setLat(+e.target.value)}
                            className="input-glass text-sm font-mono w-36 text-center" placeholder="Latitude" />
                        <input type="number" step="0.01" value={lng} onChange={e => setLng(+e.target.value)}
                            className="input-glass text-sm font-mono w-36 text-center" placeholder="Longitude" />
                    </div>
                    <button onClick={handleRunAnalysis} className="btn-solid text-sm px-10">
                        🔬 INITIATE GEMINI ANALYSIS
                    </button>
                </div>
            ) : loading ? (
                <div className="glass rounded-2xl p-16 animate-fade-up delay-1">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 border-3 border-[#fbbf24] border-t-transparent rounded-full animate-spin" />
                        <div className="text-[#fbbf24] font-mono text-sm tracking-widest animate-pulse">QUERYING ISRIC & GEMINI...</div>
                        <div className="text-white/15 text-xs font-mono">Analyzing nitrogen, pH, organic carbon, clay, sand, CEC</div>
                    </div>
                </div>
            ) : insight ? (
                <div className="space-y-5 animate-fade-up">

                    {/* Score + Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5">
                        {/* Score Meter */}
                        <div className="glass rounded-2xl p-6 text-center">
                            <div className="text-white/20 text-[10px] font-mono tracking-widest mb-6">SOIL HEALTH SCORE</div>
                            <div className="relative inline-flex items-center justify-center w-36 h-36 mb-4">
                                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="50" fill="none" stroke={healthColor} strokeWidth="8"
                                        strokeDasharray={`${(Number(insight.health_score) / 100) * 314} 314`}
                                        strokeLinecap="round" className="transition-all duration-1000" />
                                </svg>
                                <span className="text-3xl font-bold font-mono" style={{ color: healthColor }}>
                                    {insight.health_score}%
                                </span>
                            </div>
                            <div className="text-sm font-bold uppercase tracking-wider" style={{ color: healthColor }}>
                                {Number(insight.health_score) > 75 ? 'Excellent' : Number(insight.health_score) > 50 ? 'Moderate' : 'Poor'}
                            </div>
                            <button onClick={() => setInsight(null)} className="btn-glass text-xs mt-6 w-full py-3">↻ NEW ANALYSIS</button>
                        </div>

                        {/* Analysis */}
                        <div className="glass rounded-2xl p-6">
                            <div className="text-white/20 text-[10px] font-mono tracking-widest mb-3">GEMINI AGRONOMIST ANALYSIS</div>
                            <div className="glass-sm rounded-xl p-5 mb-5">
                                <div className="text-white/70 text-sm leading-relaxed">{insight.analysis}</div>
                            </div>

                            <div className="text-white/20 text-[10px] font-mono tracking-widest mb-3">RECOMMENDED ACTIONS</div>
                            <div className="space-y-2">
                                {(insight.action_items || []).map((action: string, idx: number) => (
                                    <div key={idx} className="glass-sm rounded-xl p-3 flex items-center gap-3 glass-hover">
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[rgba(167,139,250,0.2)] to-transparent flex items-center justify-center text-xs text-[#a78bfa] font-bold">
                                            {idx + 1}
                                        </div>
                                        <span className="text-white/60 text-xs flex-1">{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Estimated Matrix Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Soil Type", value: "Loamy", icon: "🏔", color: "#a78bfa" },
                            { label: "Moisture", value: "Medium", icon: "💧", color: "#06b6d4" },
                            { label: "pH Estimate", value: "Neutral", icon: "⚗️", color: "#34d399" },
                            { label: "Fertility", value: `${insight.health_score || 75}%`, icon: "🌱", color: "#fbbf24" },
                        ].map((c, i) => (
                            <div key={i} className="glass rounded-xl p-4 text-center glass-hover">
                                <div className="text-2xl mb-2">{c.icon}</div>
                                <div className="text-white/20 text-[9px] font-mono tracking-widest">{c.label}</div>
                                <div className="text-lg font-bold mt-1" style={{ color: c.color }}>{c.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
