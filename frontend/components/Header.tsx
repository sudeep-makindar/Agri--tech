import React from "react";

export function Header() {
    return (
        <div className="px-6 h-[60px] flex items-center justify-between sticky top-0 z-50 glass border-b border-white/5">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(167,139,250,0.1)] border border-white/10 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                    🌿
                </div>
                <div>
                    <div className="gradient-text text-[15px] font-bold tracking-wide">
                        AgriAI Nexus
                    </div>
                    <div className="text-white/20 text-[9px] tracking-[2px] font-mono">
                        SMART AGRICULTURAL INTELLIGENCE
                    </div>
                </div>
                <div className="flex items-center gap-1.5 ml-3 glass-sm px-3 py-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
                    <span className="text-[#34d399] text-[10px] tracking-wider font-mono font-medium">
                        LIVE
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-white/20 text-[9px] tracking-[2px] font-mono">STATUS</div>
                    <div className="text-[#34d399] text-[11px] font-mono font-medium">● All Systems Online</div>
                </div>
                <div
                    className="w-9 h-9 rounded-xl glass-sm border border-white/10 flex items-center justify-center text-sm cursor-pointer hover:border-[rgba(0,229,255,0.3)] transition-all duration-300"
                >
                    👤
                </div>
            </div>
        </div>
    );
}
