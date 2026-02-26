import React from "react";

export function Badge({ text, color }: { text: string, color: string }) {
    return (
        <span
            style={{
                background: `${color}22`,
                color: color,
                borderColor: `${color}44`,
            }}
            className="border rounded px-1.5 py-0.5 text-[10px] font-mono tracking-wider"
        >
            {text}
        </span>
    );
}
