"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SectionHeader } from "./ui/SectionHeader";

const TOOLTIP_STYLE = { background: "#0d1520", border: "1px solid #1e3a5f", borderRadius: 8, color: "#e8f0fe", fontSize: 11 };

export function RiskTrendChart({ data }: { data: any[] }) {
    return (
        <div className="bg-[#0c1620] border border-[#1a2d45] rounded-xl p-4">
            <SectionHeader title="7-Day Risk Telemetry" sub="Failure probability by crop" accent="#ff453a" />
            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff453a" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ff453a" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff9f0a" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ff9f0a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                        <XAxis dataKey="day" tick={{ fill: "#4a6a8a", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#4a6a8a", fontSize: 10 }} domain={[0, 1]} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Area type="monotone" dataKey="rice" stroke="#ff453a" fill="url(#rg1)" strokeWidth={2} name="Rice" />
                        <Area type="monotone" dataKey="cotton" stroke="#ff9f0a" fill="url(#rg2)" strokeWidth={2} name="Cotton" />
                        <Area type="monotone" dataKey="wheat" stroke="#30d158" fill="none" strokeWidth={2} name="Wheat" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
