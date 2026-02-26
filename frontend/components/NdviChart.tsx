"use client";

import React from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { SectionHeader } from "./ui/SectionHeader";

const TOOLTIP_STYLE = { background: "#0d1520", border: "1px solid #1e3a5f", borderRadius: 8, color: "#e8f0fe", fontSize: 11 };

export function NdviChart({ data }: { data: any[] }) {
    return (
        <div className="bg-[#0c1620] border border-[#1a2d45] rounded-xl p-4">
            <SectionHeader title="NDVI Satellite Stream" sub="30-day vegetation index" accent="#30d158" />
            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                        <XAxis dataKey="day" tick={{ fill: "#4a6a8a", fontSize: 9 }} />
                        <YAxis tick={{ fill: "#4a6a8a", fontSize: 9 }} domain={[0, 1]} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <ReferenceLine y={0.4} stroke="#ff453a" strokeDasharray="4 4" />
                        <Area type="monotone" dataKey="ndvi" stroke="#30d158" fill="#30d15822" strokeWidth={2} name="NDVI" />
                        <Line type="monotone" dataKey="evi" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="EVI" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
