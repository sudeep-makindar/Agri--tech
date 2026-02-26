"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

export default function RiskEnginePage() {
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState("");
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { data: s } = await supabase.auth.getSession();
            const jwt = s.session?.access_token;
            setToken(jwt || null);
            try {
                if (jwt) {
                    const data: any = await api.farms(jwt);
                    setFarms(data.farms || []);
                    if (data.farms?.length > 0) setSelectedFarmId(data.farms[0].id);
                } else {
                    const mock = [{ id: 'mock-1', name: 'Demo Field Alpha', crop_type: 'Rice', acres: 15 }];
                    setFarms(mock);
                    setSelectedFarmId(mock[0].id);
                }
            } catch { }
            setLoading(false);
        })();
    }, []);

    const handleRunEngine = async () => {
        if (!selectedFarmId) return;
        setEvaluating(true);
        setResult(null);
        try {
            if (token) {
                const response = await api.riskPredict(selectedFarmId, token);
                setResult(response);
            } else {
                await new Promise(r => setTimeout(r, 1500));
                setResult({ risk_score: 42.5, severity: "HIGH", flags: ["Low Soil Moisture", "High Temp Alert"], alert_generated: true });
            }
        } catch (err: any) {
            alert("Risk Engine failed: " + err.message);
        } finally {
            setEvaluating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-10 h-10 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
                <div className="text-white/30 text-xs font-mono tracking-widest">LOADING RISK PARAMETERS...</div>
            </div>
        </div>
    );

    const scoreColor = result ? (result.risk_score > 60 ? '#f87171' : result.risk_score > 30 ? '#fbbf24' : '#34d399') : '#00e5ff';
    const riskCategory = result ? (result.risk_score > 60 ? 'High Risk' : result.risk_score > 30 ? 'Medium Risk' : 'Low Risk') : '';

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="animate-fade-up">
                <h1 className="text-2xl font-bold text-white mb-1">Risk Engine</h1>
                <p className="text-white/30 text-sm">Multi-layer agrometrics early warning pipeline</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">

                {/* Controls */}
                <div className="glass rounded-2xl p-6 animate-fade-up delay-1">
                    <div className="text-[10px] tracking-[3px] text-white/20 font-mono uppercase mb-4">Select Target Zone</div>
                    <select
                        value={selectedFarmId}
                        onChange={e => setSelectedFarmId(e.target.value)}
                        className="input-glass w-full mb-6 font-mono text-xs"
                    >
                        {farms.length === 0 ? <option value="">No farms registered</option> : farms.map(f => (
                            <option key={f.id} value={f.id}>{f.name} — {f.crop_type} ({f.acres} ac)</option>
                        ))}
                    </select>

                    <button
                        onClick={handleRunEngine}
                        disabled={evaluating || !selectedFarmId}
                        className="btn-danger w-full disabled:opacity-40"
                    >
                        {evaluating ? "EXECUTING PIPELINE..." : "⚡ RUN RISK EVALUATION"}
                    </button>

                    <div className="mt-8 border-t border-white/5 pt-4">
                        <div className="text-white/15 text-[10px] font-mono tracking-wider mb-2">PIPELINE STAGES</div>
                        <ul className="text-white/20 text-[10px] font-mono space-y-1.5">
                            <li>1. Fetch OWM Weather Arrays</li>
                            <li>2. Fetch ISRIC Soil Grids</li>
                            <li>3. Agromonitoring NDVI Synthesis</li>
                            <li>4. Multilayer Risk Scoring</li>
                            <li>5. Asynchronous Alert Paging</li>
                        </ul>
                    </div>
                </div>

                {/* Output */}
                <div className="glass rounded-2xl p-6 min-h-[420px] animate-fade-up delay-2">
                    {evaluating ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin" />
                            <div className="text-[#f97316] font-mono text-sm animate-pulse tracking-wider">EVALUATING RISK TENSOR...</div>
                        </div>
                    ) : result ? (
                        <div className="animate-fade-up space-y-6">
                            {/* Score Meter */}
                            <div className="glass-sm rounded-2xl p-6 text-center">
                                <div className="text-white/20 text-[10px] font-mono tracking-widest mb-4">CROP RISK SCORE</div>
                                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                                    <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="8"
                                            strokeDasharray={`${(result.risk_score / 100) * 314} 314`}
                                            strokeLinecap="round" className="transition-all duration-1000" />
                                    </svg>
                                    <span className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>{result.risk_score.toFixed(0)}%</span>
                                </div>
                                <div className="text-lg font-bold uppercase tracking-wider" style={{ color: scoreColor }}>{riskCategory}</div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="glass-sm rounded-xl p-4">
                                    <div className="text-white/20 text-[9px] font-mono tracking-widest mb-1">SEVERITY</div>
                                    <div className="text-lg font-bold uppercase" style={{ color: scoreColor }}>{result.severity}</div>
                                </div>
                                <div className="glass-sm rounded-xl p-4">
                                    <div className="text-white/20 text-[9px] font-mono tracking-widest mb-1">ALERT</div>
                                    <div className={`text-lg font-bold font-mono ${result.alert_generated ? 'text-[#f87171]' : 'text-white/20'}`}>
                                        {result.alert_generated ? "TRIGGERED" : "BYPASSED"}
                                    </div>
                                </div>
                            </div>

                            {/* Progress bars for risk factors */}
                            <div className="space-y-3">
                                <div className="text-white/20 text-[10px] font-mono tracking-widest">RISK FACTORS</div>
                                {(result.flags || []).map((flag: string, i: number) => (
                                    <div key={i} className="glass-sm rounded-xl p-3">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-white/50 text-xs">🚨 {flag}</span>
                                            <span className="text-[#f87171] text-xs font-mono">{70 + i * 10}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-bar-fill" style={{
                                                width: `${70 + i * 10}%`,
                                                background: `linear-gradient(90deg, #f87171, #f97316)`
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-white/15">
                            <div className="text-5xl mb-4 opacity-30 animate-float">⚡</div>
                            <div className="font-mono text-sm tracking-wider">Awaiting Execution</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
