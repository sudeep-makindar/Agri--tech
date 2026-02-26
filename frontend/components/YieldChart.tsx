"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SectionHeader } from "./ui/SectionHeader";

const TOOLTIP_STYLE = { background: "#0d1520", border: "1px solid #1e3a5f", borderRadius: 8, color: "#e8f0fe", fontSize: 11 };

export function YieldChart({ data }: { data: any[] }) {
    return (
        <div className="bg-[#0c1620] border border-[#1a2d45] rounded-xl p-4">
            <SectionHeader title="Historical Yield" sub="Tonnes per hectare 2019–2024" accent="#bf5af2" />
            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={10}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                        <XAxis dataKey="year" tick={{ fill: "#4a6a8a", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#4a6a8a", fontSize: 10 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#1a2d45' }} />
                        <Bar dataKey="rice" fill="#00e5ff" radius={[2, 2, 0, 0]} name="Rice" />
                        <Bar dataKey="cotton" fill="#ff9f0a" radius={[2, 2, 0, 0]} name="Cotton" />
                        <Bar dataKey="wheat" fill="#30d158" radius={[2, 2, 0, 0]} name="Wheat" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
