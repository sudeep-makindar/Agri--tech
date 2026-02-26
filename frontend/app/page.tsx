"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

export default function OverviewPage() {
  const [weather, setWeather] = useState<any>(null);
  const [soil, setSoil] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [lat, setLat] = useState<number>(20.5937);
  const [lng, setLng] = useState<number>(78.9629);
  const [locationName, setLocationName] = useState("Detecting...");
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
    // Auto-detect location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
        () => { loadDashboardData(); } // fallback
      );
    } else {
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    if (isClient) loadDashboardData();
  }, [lat, lng]);

  const loadDashboardData = async () => {
    try {
      const wData: any = await api.weather(lat, lng);
      setWeather({
        temp: wData.temp || wData.temperature,
        humidity: wData.humidity,
        rainfall: wData.rainfall || wData.rain_1h || 0,
        wind: wData.wind || wData.wind_speed,
        pressure: wData.pressure,
        description: wData.description || "",
      });
      const sData: any = await api.soil(lat, lng);
      setSoil(sData);
    } catch (e) {
      console.error("Sensor fetch error", e);
    }

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const geoData = await geoRes.json();
      const loc = geoData.address;
      const place = loc ? (loc.city || loc.town || loc.village || loc.county || loc.state || "Unknown") : "Unknown";
      setLocationName(place);
    } catch { setLocationName("GPS Coordinates"); }

    try {
      const { data: al } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(4);
      if (al) setAlerts(al);
    } catch { }
  };

  const handleGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
        (err) => alert("Location error: " + err.message)
      );
    }
  };

  if (!isClient || !weather) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
          <div className="text-white/30 text-sm font-mono tracking-widest">INITIALIZING SENSORS...</div>
        </div>
      </div>
    );
  }

  const modules = [
    { name: "Crop Recommendation", desc: "Random Forest ML for crop suitability", icon: "🌱", href: "/market", color: "#34d399" },
    { name: "Disease Scanner", desc: "MobileNetV2 CNN leaf pathology", icon: "🦠", href: "/disease", color: "#f87171" },
    { name: "Market Intelligence", desc: "ARIMA forecasting & live mandi prices", icon: "📊", href: "/market", color: "#fbbf24" },
    { name: "Soil Agronomy", desc: "Gemini powered NPK/pH deep analysis", icon: "🔬", href: "/soil", color: "#a78bfa" },
    { name: "Risk Engine", desc: "Multi-layer early warning system", icon: "⚡", href: "/risk", color: "#f97316" },
    { name: "Farm Registration", desc: "Polygon zone management & GPS sync", icon: "🌾", href: "/farms", color: "#06b6d4" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ─── Hero Section ─── */}
      <div className="glass rounded-3xl p-8 relative overflow-hidden animate-fade-up">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,229,255,0.05)] to-[rgba(167,139,250,0.03)]" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="text-[10px] tracking-[4px] text-white/20 font-mono uppercase mb-3">Welcome to AgriAI Nexus</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Smart Farming, <span className="gradient-text">Powered by AI</span>
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-xl">
              Real-time weather intelligence, soil analytics, crop disease detection, market price forecasting,
              and risk assessment — all powered by machine learning models designed for Indian agriculture.
            </p>
          </div>

          <div className="glass-sm p-5 min-w-[280px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📍</div>
              <div>
                <div className="text-[#00e5ff] font-semibold text-sm capitalize">{locationName}</div>
                <div className="text-white/20 text-[10px] font-mono">{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col flex-1">
                <input type="number" step="any" value={lat} onChange={e => setLat(Number(e.target.value))} className="input-glass text-xs font-mono" placeholder="Lat" />
              </div>
              <div className="flex flex-col flex-1">
                <input type="number" step="any" value={lng} onChange={e => setLng(Number(e.target.value))} className="input-glass text-xs font-mono" placeholder="Lng" />
              </div>
            </div>
            <button onClick={handleGPS} className="btn-solid w-full mt-3 text-xs py-3">
              📍 USE MY CURRENT LOCATION
            </button>
          </div>
        </div>
      </div>

      {/* ─── Weather Metrics ─── */}
      <div className="animate-fade-up delay-1">
        <div className="text-[10px] tracking-[3px] text-white/15 font-mono uppercase mb-3 px-1">Live Environmental Sensors</div>
        <div className="flex gap-3 flex-wrap">
          <MetricCard icon="🌡" label="Temperature" value={weather.temp} unit="°C" change={0} color="#f97316" />
          <MetricCard icon="💧" label="Humidity" value={weather.humidity} unit="%" change={0} color="#06b6d4" />
          <MetricCard icon="🌧" label="Rainfall" value={weather.rainfall} unit="mm" color="#818cf8" />
          <MetricCard icon="💨" label="Wind" value={weather.wind} unit="m/s" change={0} color="#94a3b8" />
          <MetricCard icon="📡" label="Pressure" value={weather.pressure} unit="hPa" color="#a78bfa" />
        </div>
      </div>

      {/* ─── AI Modules Grid ─── */}
      <div className="animate-fade-up delay-2">
        <div className="text-[10px] tracking-[3px] text-white/15 font-mono uppercase mb-3 px-1">AI Modules</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m, i) => (
            <a key={m.name} href={m.href} className={`glass glass-hover rounded-2xl p-5 cursor-pointer animate-fade-up delay-${i + 1} group`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl group-hover:scale-110 transition-transform">{m.icon}</div>
                <div className="flex-1">
                  <div className="text-white/90 font-semibold text-[13px] mb-0.5">{m.name}</div>
                  <div className="text-white/25 text-[11px] leading-relaxed">{m.desc}</div>
                </div>
                <div className="text-white/10 group-hover:text-white/30 transition-colors text-lg">→</div>
              </div>
              <div className="mt-3 h-[2px] rounded" style={{ background: `linear-gradient(90deg, ${m.color}40, transparent)` }} />
            </a>
          ))}
        </div>
      </div>

      {/* ─── Alerts ─── */}
      {alerts.length > 0 && (
        <div className="animate-fade-up delay-4">
          <div className="text-[10px] tracking-[3px] text-white/15 font-mono uppercase mb-3 px-1">Recent Alerts</div>
          <div className="glass rounded-2xl p-4 space-y-2">
            {alerts.map((a: any) => (
              <div key={a.id} className="glass-sm rounded-xl p-3 flex items-center gap-3">
                <div className="text-lg">{a.icon || "⚠️"}</div>
                <div className="flex-1">
                  <div className="text-white/70 text-xs font-medium">{a.message || a.type}</div>
                  <div className="text-white/20 text-[10px] font-mono">{a.severity} • {new Date(a.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
