"use client";

import React from "react";
import { SectionHeader } from "./ui/SectionHeader";
import { SEV_COLORS } from "@/lib/mockData";

export function AlertFeed({ alerts }: { alerts: any[] }) {
    return (
        <div className="bg-[#0c1620] border border-[#1a2d45] rounded-xl p-4">
            <SectionHeader title="Alert Feed" sub="AI-generated warnings" accent="#ff453a" />
            <div className="flex flex-col gap-2 max-h-[280px] overflow-auto pr-1">
                {alerts.map(a => (
                    <div
                        key={a.id}
                        style={{
                            borderColor: `${SEV_COLORS[a.sev]}33`,
                            borderLeftColor: SEV_COLORS[a.sev]
                        }}
                        className="bg-[#0a1520] border border-l-[3px] rounded-lg py-2 px-2.5"
                    >
                        <div className="flex justify-between mb-[3px]">
                            <span style={{ color: SEV_COLORS[a.sev] }} className="text-[10px] font-bold tracking-wider uppercase font-mono">
                                {a.icon} {a.type}
                            </span>
                            <span className="text-[#2a4a6a] text-[9px] font-mono">{a.time}</span>
                        </div>
                        <div className="text-[#c8d8e8] text-[11px] leading-relaxed">{a.msg}</div>
                        <div className="text-[#4a6a8a] text-[9px] mt-0.5 font-mono tracking-wide">{a.farm}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
