"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect, useCallback } from "react";

interface GlobeProps {
    className?: string;
    size?: number;
    dotColor?: string;
    arcColor?: string;
    markerColor?: string;
    autoRotateSpeed?: number;
    connections?: { from: [number, number]; to: [number, number] }[];
    markers?: { lat: number; lng: number; label?: string }[];
    scrollRotation?: number; // Pass scroll progress here
}

const DEFAULT_MARKERS = [
    { lat: 15.31, lng: 75.71, label: "Lefora Hub" },
    { lat: 37.78, lng: -122.42, label: "Agri Tech San Francisco" },
    { lat: 1.35, lng: 103.82, label: "Singapore Vertical Farm" },
    { lat: 51.51, lng: -0.13, label: "London Research" },
    { lat: -1.29, lng: 36.82, label: "Nairobi Field" },
    { lat: 28.61, lng: 77.21, label: "Delhi Base" },
    { lat: -23.55, lng: -46.63, label: "São Paulo Logistics" },
];

const DEFAULT_CONNECTIONS: { from: [number, number]; to: [number, number] }[] = [
    { from: [15.31, 75.71], to: [-1.29, 36.82] },
    { from: [15.31, 75.71], to: [28.61, 77.21] },
    { from: [28.61, 77.21], to: [1.35, 103.82] },
    { from: [-1.29, 36.82], to: [51.51, -0.13] },
];

function latLngToXYZ(lat: number, lng: number, radius: number): [number, number, number] {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    return [
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    ];
}

function rotateY(x: number, y: number, z: number, angle: number): [number, number, number] {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos + z * sin, y, -x * sin + z * cos];
}

function rotateX(x: number, y: number, z: number, angle: number): [number, number, number] {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x, y * cos - z * sin, y * sin + z * cos];
}

function project(x: number, y: number, z: number, cx: number, cy: number, fov: number): [number, number, number] {
    const scale = fov / (fov + z);
    return [x * scale + cx, y * scale + cy, z];
}

export function Globe({
    className,
    size = 600,
    dotColor = "rgba(16, 185, 129, ALPHA)", // Lefora Green
    arcColor = "rgba(16, 185, 129, 0.4)",
    markerColor = "rgba(52, 211, 153, 1)",
    autoRotateSpeed = 0.001,
    connections = DEFAULT_CONNECTIONS,
    markers = DEFAULT_MARKERS,
    scrollRotation = 0,
}: GlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rotYRef = useRef(0.4);
    const rotXRef = useRef(0.3);
    const dragRef = useRef({ active: false, startX: 0, startY: 0, startRotY: 0, startRotX: 0 });
    const animRef = useRef<number>(0);
    const timeRef = useRef(0);
    const dotsRef = useRef<[number, number, number][]>([]);

    useEffect(() => {
        const dots: [number, number, number][] = [];
        const numDots = 1500;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        for (let i = 0; i < numDots; i++) {
            const theta = (2 * Math.PI * i) / goldenRatio;
            const phi = Math.acos(1 - (2 * (i + 0.5)) / numDots);
            dots.push([Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)]);
        }
        dotsRef.current = dots;
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.38;
        const fov = 800;

        // Auto rotate + Scroll rotation
        if (!dragRef.current.active) {
            rotYRef.current += autoRotateSpeed;
        }

        timeRef.current += 0.012;
        const time = timeRef.current;

        ctx.clearRect(0, 0, w, h);

        // Green Atmosphere Glow
        const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.3);
        glowGrad.addColorStop(0, "rgba(16, 185, 129, 0.12)");
        glowGrad.addColorStop(0.5, "rgba(5, 150, 105, 0.04)");
        glowGrad.addColorStop(1, "rgba(5, 150, 105, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Combined rotation: manual + auto + scroll
        const ry = rotYRef.current + scrollRotation * 10; // Scroll affects rotation
        const rx = rotXRef.current;

        // Draw dots
        const dots = dotsRef.current;
        for (let i = 0; i < dots.length; i++) {
            let [x, y, z] = dots[i];
            x *= radius; y *= radius; z *= radius;

            [x, y, z] = rotateX(x, y, z, rx);
            [x, y, z] = rotateY(x, y, z, ry);

            if (z > 0) continue;

            const [sx, sy] = project(x, y, z, cx, cy, fov);
            const depthAlpha = Math.max(0.1, 1 - (z + radius) / (2 * radius));

            ctx.beginPath();
            ctx.arc(sx, sy, 1 + depthAlpha * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = dotColor.replace("ALPHA", (depthAlpha * 0.8).toFixed(2));
            ctx.fill();
        }

        // Connections
        for (const conn of connections) {
            const [lat1, lng1] = conn.from;
            const [lat2, lng2] = conn.to;
            let [x1, y1, z1] = latLngToXYZ(lat1, lng1, radius);
            let [x2, y2, z2] = latLngToXYZ(lat2, lng2, radius);
            [x1, y1, z1] = rotateX(x1, y1, z1, rx);[x1, y1, z1] = rotateY(x1, y1, z1, ry);
            [x2, y2, z2] = rotateX(x2, y2, z2, rx);[x2, y2, z2] = rotateY(x2, y2, z2, ry);

            if (z1 > radius * 0.5 && z2 > radius * 0.5) continue;

            const [sx1, sy1] = project(x1, y1, z1, cx, cy, fov);
            const [sx2, sy2] = project(x2, y2, z2, cx, cy, fov);

            const midX = (x1 + x2) / 2; const midY = (y1 + y2) / 2; const midZ = (z1 + z2) / 2;
            const midLen = Math.sqrt(midX * midX + midY * midY + midZ * midZ);
            const arcHeight = radius * 1.3;
            const elevX = (midX / midLen) * arcHeight; const elevY = (midY / midLen) * arcHeight; const elevZ = (midZ / midLen) * arcHeight;
            const [scx, scy] = project(elevX, elevY, elevZ, cx, cy, fov);

            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.quadraticCurveTo(scx, scy, sx2, sy2);
            ctx.strokeStyle = arcColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            const t = (Math.sin(time * 0.8 + lat1 * 0.2) + 1) / 2;
            const tx = (1 - t) * (1 - t) * sx1 + 2 * (1 - t) * t * scx + t * t * sx2;
            const ty = (1 - t) * (1 - t) * sy1 + 2 * (1 - t) * t * scy + t * t * sy2;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = markerColor;
            ctx.shadowBlur = 4; ctx.shadowColor = markerColor;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Markers
        for (const marker of markers) {
            let [x, y, z] = latLngToXYZ(marker.lat, marker.lng, radius);
            [x, y, z] = rotateX(x, y, z, rx);[x, y, z] = rotateY(x, y, z, ry);
            if (z > radius * 0.2) continue;
            const [sx, sy] = project(x, y, z, cx, cy, fov);

            const pulse = Math.sin(time * 2.5 + marker.lat) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(sx, sy, 3 + pulse * 6, 0, Math.PI * 2);
            ctx.strokeStyle = markerColor.replace("1)", `${0.1 + pulse * 0.2})`);
            ctx.lineWidth = 1.5; ctx.stroke();
            ctx.beginPath();
            ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = markerColor; ctx.fill();

            if (marker.label) {
                ctx.font = "500 10px system-ui";
                const tw = ctx.measureText(marker.label).width;
                ctx.fillStyle = "rgba(0,0,0,0.4)";
                ctx.roundRect(sx + 10, sy - 10, tw + 8, 16, 4);
                ctx.fill();
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.fillText(marker.label, sx + 14, sy + 2);
            }
        }

        animRef.current = requestAnimationFrame(draw);
    }, [dotColor, arcColor, markerColor, autoRotateSpeed, connections, markers, scrollRotation]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startRotY: rotYRef.current, startRotX: rotXRef.current };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        rotYRef.current = dragRef.current.startRotY + dx * 0.005;
        rotXRef.current = Math.max(-1.5, Math.min(1.5, dragRef.current.startRotX + dy * 0.005));
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={cn("w-full h-full cursor-grab active:cursor-grabbing select-none", className)}
            style={{ width: size, height: size }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (dragRef.current.active = false)}
        />
    );
}
