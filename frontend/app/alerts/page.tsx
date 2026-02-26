"use client";

import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { genAlerts, SEVERITIES, SEV_COLORS, randInt } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";

const TOOLTIP_STYLE = { background: "rgba(8,12,20,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#e0e8f0", fontSize: 11, backdropFilter: "blur(12px)" };

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [liveLog, setLiveLog] = useState<string[]>([]);
    const logRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setAlerts(genAlerts());

        const seedLogs = [
            "[ SYS ] Neural interface initialized v2.1.0",
            "[ DB  ] Supabase connection established",
            "[ ML  ] Loaded model: weights/mobilenet_plantvillage_v1.h5",
            "[ API ] Weather endpoints synchronized (OpenWeatherMap)",
            "[ SYS ] Awaiting real-time telemetry from nodes...",
        ];
        setLiveLog(seedLogs);

        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
                const n = payload.new;
                setAlerts(prev => [{ id: n.id, type: n.type, farm: `Farm ${n.farm_id}`, msg: n.message, sev: n.severity, time: "Just now", icon: n.icon || "⚠️" }, ...prev]);
                setLiveLog(prev => [...prev.slice(-30), `[ DB  ] SECURE PUSH: New ${n.severity} alert for Farm ${n.farm_id}`]);
            }).subscribe();

        const intvl = setInterval(() => {
            const msgs = [
                "[ ML  ] Ingesting satellite NDVI batch data...",
                "[ API ] Market node query: Tamil Nadu (Rice)",
                "[ DB  ] Recorded 12x telemetry points",
                "[ ML  ] ARIMA forecast computation complete",
                "[ SYS ] Memory: 24.1% allocated, GC OK",
            ];
            setLiveLog(prev => {
                const next = [...prev, msgs[Math.floor(Math.random() * msgs.length)]];
                return next.length > 30 ? next.slice(-30) : next;
            });
        }, 4000);

        return () => { clearInterval(intvl); supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [liveLog]);

    if (!isClient) return null;

    const chartData = SEVERITIES.map(s => ({ sev: s, count: randInt(1, 10) }));

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <div className="animate-fade-up">
                <h1 className="text-2xl font-bold text-white mb-1">Alert Feed</h1>
                <p className="text-white/30 text-sm">AI-generated warnings & real-time telemetry stream</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Alert Feed */}
                <div className="animate-fade-up delay-1 space-y-3">
                    {alerts.map(a => (
                        <div key={a.id} className="glass rounded-2xl p-4 glass-hover" style={{ borderLeft: `3px solid ${SEV_COLORS[a.sev]}` }}>
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{a.icon}</span>
                                    <span style={{ color: SEV_COLORS[a.sev] }} className="text-xs font-bold uppercase tracking-wide font-mono">{a.type}</span>
                                    <span className="glass-sm px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium" style={{ color: SEV_COLORS[a.sev] }}>{a.sev}</span>
                                </div>
                                <span className="text-white/15 text-[10px] font-mono">{a.time}</span>
                            </div>
                            <div className="text-white/70 text-sm mb-1.5">{a.msg}</div>
                            <div className="text-white/20 text-[10px] font-mono">📍 {a.farm}</div>
                            <div className="flex gap-2 mt-3">
                                <button className="btn-glass text-[10px] py-2 px-4">Acknowledge</button>
                                <button className="btn-danger text-[10px] py-2 px-4">Escalate</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analytics + Log */}
                <div className="flex flex-col gap-5">
                    <div className="glass rounded-2xl p-5 animate-fade-up delay-2">
                        <div className="text-white/80 font-semibold text-sm mb-1">Alert Analytics</div>
                        <div className="text-white/20 text-[10px] font-mono mb-4">Severity distribution over 24h</div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="sev" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} />
                                    <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Bar dataKey="count" name="Alerts" radius={[6, 6, 0, 0]}>
                                        {chartData.map((_: any, i: number) => (
                                            <Cell key={i} fill={SEV_COLORS[SEVERITIES[i]]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-5 flex-1 animate-fade-up delay-3">
                        <div className="text-white/80 font-semibold text-sm mb-1">System Log</div>
                        <div className="text-white/20 text-[10px] font-mono mb-3">Live telemetry stream</div>
                        <div ref={logRef} className="h-[240px] overflow-auto font-mono text-[10px] pr-2 space-y-1.5">
                            {liveLog.map((l, i) => (
                                <div key={i} className="text-white/30 border-b border-white/3 pb-1"
                                    style={{ color: l.startsWith("[ SYS") ? "#00e5ff" : l.startsWith("[ ML") ? "#a78bfa" : l.startsWith("[ DB") ? "#34d399" : l.startsWith("[ API") ? "#fbbf24" : undefined }}>
                                    {l}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
