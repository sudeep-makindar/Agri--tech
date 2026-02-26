"use client";

import React from "react";
import { SectionHeader } from "./ui/SectionHeader";

export function FarmStatusTable({ farms, selectedFarm, onSelectFarm }: { farms: any[], selectedFarm: string | number, onSelectFarm: (id: string | number) => void }) {
    return (
        <div className="bg-[#0c1620] border border-[#1a2d45] rounded-xl p-4">
            <SectionHeader title="Farm Status Matrix" sub="All active zones — real-time telemetry" />
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px]">
                    <thead>
                        <tr>
                            {["Farm", "Crop", "Acres", "Risk", "Moisture", "NDVI", "Health", "Stage"].map(h => (
                                <th key={h} className="text-[#4a6a8a] text-left py-1.5 px-2 border-b border-[#1a2d45] text-[9px] tracking-[1px] font-normal uppercase font-mono">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {farms.map(f => (
                            <tr
                                key={f.id}
                                onClick={() => onSelectFarm(f.id)}
                                className={`cursor-pointer transition-colors hover:bg-[#0f1e2d] ${selectedFarm === f.id ? 'bg-[#0f2030]' : 'bg-transparent'}`}
                            >
                                <td className="py-[7px] px-2 text-[#c8d8e8] whitespace-nowrap">
                                    {f.alert && <span className="mr-1">🔴</span>}
                                    {f.name.split(" ").slice(0, 2).join(" ")}
                                </td>
                                <td className="py-[7px] px-2 text-[#00e5ff]">{f.crop}</td>
                                <td className="py-[7px] px-2 text-[#6b7a90]">{f.acres}</td>
                                <td className="py-[7px] px-2 font-mono">
                                    <span style={{ color: f.risk > 0.7 ? "#ff453a" : f.risk > 0.4 ? "#ff9f0a" : "#30d158" }}>
                                        {(f.risk * 100).toFixed(0)}%
                                    </span>
                                </td>
                                <td className="py-[7px] px-2 text-[#5e9fe0]">{f.moisture.toFixed(0)}%</td>
                                <td className="py-[7px] px-2 text-[#30d158] font-mono">{f.ndvi.toFixed(2)}</td>
                                <td className="py-[7px] px-2 text-[#c8d8e8]">{f.health}%</td>
                                <td className="py-[7px] px-2 text-[#bf5af2] text-[9px] uppercase tracking-wide">{f.stage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
