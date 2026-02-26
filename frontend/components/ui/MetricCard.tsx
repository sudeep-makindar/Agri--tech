import React from "react";

interface MetricCardProps {
    icon: string | React.ReactNode;
    label: string;
    value: number | string;
    unit?: string;
    change?: number;
    color: string;
    sub?: string;
}

export function MetricCard({ icon, label, value, unit, change, color, sub }: MetricCardProps) {
    return (
        <div className="glass glass-hover rounded-2xl p-4 px-5 relative overflow-hidden flex-1 min-w-[140px] group">
            {/* Glow accent */}
            <div
                style={{ background: `radial-gradient(circle, ${color}12 0%, transparent 70%)` }}
                className="absolute top-0 right-0 w-24 h-24 transition-opacity group-hover:opacity-100 opacity-60"
            />
            <div className="relative z-10">
                <div className="text-[22px] mb-1.5">{icon}</div>
                <div className="text-white/30 text-[10px] tracking-widest uppercase font-mono font-medium">
                    {label}
                </div>
                <div className="text-white text-2xl font-bold font-mono mt-1">
                    {value}
                    {unit && <span className="text-xs text-white/30 ml-1 font-medium">{unit}</span>}
                </div>
                {change !== undefined && (
                    <div
                        style={{ color: change >= 0 ? "#34d399" : "#f87171" }}
                        className="text-[11px] font-mono font-medium mt-0.5"
                    >
                        {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
                    </div>
                )}
                {sub && <div className="text-white/20 text-[10px] mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}
