"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

export default function FarmsPage() {
    const [farms, setFarms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", crop_type: "", acres: "", lat: "", lng: "" });

    useEffect(() => {
        (async () => {
            const { data: s } = await supabase.auth.getSession();
            const jwt = s.session?.access_token ?? null;
            setToken(jwt);
            try {
                if (jwt) {
                    const data: any = await api.farms(jwt);
                    setFarms(data.farms || []);
                } else {
                    setFarms([
                        { id: "demo-1", name: "North Alpha", crop_type: "Rice", acres: 15, lat: 13.08, lng: 80.27 },
                        { id: "demo-2", name: "South Beta", crop_type: "Cotton", acres: 22, lat: 11.02, lng: 76.95 },
                    ]);
                }
            } catch { }
            setLoading(false);
        })();
    }, []);

    const handleGPS = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
            }, (err) => alert("Location error: " + err.message));
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            if (token) {
                const result: any = await api.createFarm(form, token);
                setFarms([...farms, result.farm]);
            } else {
                setFarms([...farms, { id: `mock-${Date.now()}`, ...form, acres: Number(form.acres) }]);
            }
            setShowForm(false);
            setForm({ name: "", crop_type: "", acres: "", lat: "", lng: "" });
        } catch (err: any) {
            alert("Failed: " + err.message);
        }
        setCreating(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-10 h-10 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
                <div className="text-white/30 text-xs font-mono">LOADING FARM ZONES...</div>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="flex justify-between items-start animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Farm Intel</h1>
                    <p className="text-white/30 text-sm">Zone management & GPS polygon registration</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-solid text-xs">
                    {showForm ? "✕ Cancel" : "+ Register New Farm"}
                </button>
            </div>

            {/* Registration Form */}
            {showForm && (
                <div className="glass rounded-2xl p-6 animate-fade-up">
                    <div className="text-white/80 font-semibold text-sm mb-5">Register New Zone</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            className="input-glass" placeholder="Farm Name" />
                        <input value={form.crop_type} onChange={e => setForm({ ...form, crop_type: e.target.value })}
                            className="input-glass" placeholder="Crop Type (e.g. Rice)" />
                        <input type="number" value={form.acres} onChange={e => setForm({ ...form, acres: e.target.value })}
                            className="input-glass" placeholder="Area (acres)" />
                        <div className="flex gap-2">
                            <input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })}
                                className="input-glass flex-1" placeholder="Latitude" />
                            <input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })}
                                className="input-glass flex-1" placeholder="Longitude" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleGPS} className="btn-glass text-xs flex-1 py-4">
                            📍 Use My Current Location
                        </button>
                        <button onClick={handleCreate} disabled={creating || !form.name}
                            className="btn-solid text-xs flex-1 py-4 disabled:opacity-40">
                            {creating ? "REGISTERING..." : "✅ Register Now"}
                        </button>
                    </div>
                </div>
            )}

            {/* Farm Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up delay-1">
                {farms.map((f: any, i: number) => (
                    <div key={f.id} className={`glass rounded-2xl p-5 glass-hover animate-fade-up delay-${i + 1}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="text-2xl">🌾</div>
                            <div className="glass-sm px-2.5 py-1 rounded-lg">
                                <span className="text-[#34d399] text-[10px] font-mono font-medium">● Active</span>
                            </div>
                        </div>
                        <div className="text-white/90 font-semibold text-sm mb-0.5">{f.name}</div>
                        <div className="text-white/25 text-xs mb-3">{f.crop_type} · {f.acres} acres</div>
                        {f.lat && f.lng && (
                            <div className="text-white/15 text-[10px] font-mono">
                                📍 {Number(f.lat).toFixed(4)}°N, {Number(f.lng).toFixed(4)}°E
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {farms.length === 0 && (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-5xl mb-4 animate-float">🌾</div>
                    <div className="text-white/30 font-mono text-sm">No farms registered</div>
                    <div className="text-white/15 text-xs mt-1">Click "Register New Farm" to add your first zone</div>
                </div>
            )}
        </div>
    );
}
