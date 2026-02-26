import React from "react";

interface SectionHeaderProps {
    title: string;
    sub?: string;
    accent?: string;
}

export function SectionHeader({ title, sub, accent = "#00e5ff" }: SectionHeaderProps) {
    return (
        <div className="mb-3">
            <div className="text-white/90 font-semibold text-sm">{title}</div>
            {sub && <div className="text-white/20 text-[10px] font-mono">{sub}</div>}
        </div>
    );
}
