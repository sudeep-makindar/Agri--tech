"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
    { id: "/", label: "Overview", icon: "⬡" },
    { id: "/farms", label: "Farm Intel", icon: "🌾" },
    { id: "/risk", label: "Risk Engine", icon: "⚡" },
    { id: "/market", label: "Market AI", icon: "📊" },
    { id: "/disease", label: "Disease Scan", icon: "🦠" },
    { id: "/soil", label: "Soil Matrix", icon: "🔬" },
    { id: "/alerts", label: "Alert Feed", icon: "🔔" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-[220px] glass border-r border-white/5 py-5 flex flex-col sticky top-[60px] h-[calc(100vh-60px)] overflow-hidden shrink-0">
            <div className="px-5 mb-4">
                <div className="text-[9px] tracking-[3px] text-white/20 font-mono uppercase">Navigation</div>
            </div>

            <div className="flex flex-col gap-0.5 px-2">
                {NAV.map((n) => {
                    const isActive = pathname === n.id || (n.id !== "/" && pathname.startsWith(n.id));
                    return (
                        <Link
                            key={n.id}
                            href={n.id}
                            className={`px-4 py-2.5 flex items-center gap-3 rounded-xl transition-all duration-300 cursor-pointer text-[12px] tracking-wide font-medium ${isActive
                                    ? "bg-gradient-to-r from-[rgba(0,229,255,0.12)] to-transparent text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.08)]"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                                }`}
                        >
                            <span className="text-base">{n.icon}</span>
                            <span className="font-mono uppercase">{n.label}</span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse-glow" />}
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto mx-4 glass-sm p-3">
                <div className="text-[9px] tracking-[2px] text-white/15 font-mono uppercase mb-1.5">Active Zone</div>
                <div className="text-[#00e5ff] text-[11px] font-mono font-medium">Tamil Nadu Region</div>
                <div className="text-white/25 text-[10px] font-mono">Multi-Crop · AI Active</div>
            </div>
        </div>
    );
}
