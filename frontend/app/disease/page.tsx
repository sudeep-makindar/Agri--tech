"use client";
import React, { useState, useRef } from "react";
import { api } from "@/lib/api";

export default function DiseasePage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setLoading(true);
        try {
            const data = await api.diseaseDetect(selectedFile);
            setResult(data);
        } catch (error) {
            console.error("Failed:", error);
            alert("ML Inference Failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]);
    };

    const openCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setStream(mediaStream);
            setShowCamera(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            alert("Camera access denied. Please allow camera permissions.");
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const capturedFile = new File([blob], "leaf_capture.jpg", { type: "image/jpeg" });
                closeCamera();
                processFile(capturedFile);
            }
        }, "image/jpeg", 0.9);
    };

    const closeCamera = () => {
        stream?.getTracks().forEach(t => t.stop());
        setStream(null);
        setShowCamera(false);
    };

    const resetScan = () => {
        setFile(null);
        setPreviewUrl(null);
        setResult(null);
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="animate-fade-up">
                <h1 className="text-2xl font-bold text-white mb-1">Disease Scanner</h1>
                <p className="text-white/30 text-sm">MobileNetV2 CNN — PlantVillage 38-class pathology detection</p>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up">
                    <div className="glass rounded-3xl p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-white/80 font-semibold text-sm">📸 Live Camera</div>
                            <button onClick={closeCamera} className="text-white/30 hover:text-white/60 text-2xl">&times;</button>
                        </div>
                        <video ref={videoRef} className="w-full rounded-xl mb-4" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        <button onClick={capturePhoto} className="btn-solid w-full text-sm">
                            📷 CAPTURE LEAF IMAGE
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">

                {/* Upload Panel */}
                <div className="glass rounded-2xl p-6 animate-fade-up delay-1">
                    {!previewUrl ? (
                        <>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="glass-sm rounded-2xl p-10 text-center cursor-pointer glass-hover mb-4"
                            >
                                <input type="file" accept="image/jpeg,image/png" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                <input type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
                                <div className="text-5xl mb-3 animate-float">🌿</div>
                                <div className="text-white/40 text-sm mb-1">Drag & drop leaf image</div>
                                <div className="text-white/15 text-[10px]">JPEG / PNG — Max 5MB</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => fileInputRef.current?.click()} className="btn-glass text-xs py-4">
                                    📁 Upload Image
                                </button>
                                <button onClick={openCamera} className="btn-solid text-xs py-4 bg-gradient-to-r from-[#34d399] to-[#06b6d4]">
                                    📸 Open Camera
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <img src={previewUrl} alt="Leaf" className="max-h-48 mx-auto rounded-xl mb-4 object-contain" />
                            {loading && (
                                <div className="flex flex-col items-center gap-3 mb-4">
                                    <div className="w-10 h-10 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
                                    <div className="text-[#00e5ff] text-xs font-mono animate-pulse">SCANNING TISSUE...</div>
                                </div>
                            )}
                            <button onClick={resetScan} className="btn-glass text-xs w-full">🔄 SCAN ANOTHER</button>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="glass rounded-2xl p-6 animate-fade-up delay-2">
                    <div className="text-white/80 font-semibold text-sm mb-1">Analysis Report</div>
                    <div className="text-white/20 text-[10px] font-mono mb-5">Real-time feature extraction</div>

                    {result ? (
                        <div className="space-y-5 animate-fade-up">
                            <div className="glass-sm rounded-xl p-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-white/20 text-[10px] font-mono tracking-widest mb-1">CLASSIFICATION</div>
                                        <div className={`text-xl font-bold ${result.disease === 'healthy' ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                                            {result.disease === 'healthy' ? '✅ Healthy Crop' : result.disease}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white/20 text-[10px] font-mono tracking-widest mb-1">CONFIDENCE</div>
                                        <div className="text-[#34d399] text-xl font-mono font-bold">{(result.confidence * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                <div className="mt-3 progress-bar">
                                    <div className="progress-bar-fill" style={{
                                        width: `${result.confidence * 100}%`,
                                        background: result.disease === 'healthy'
                                            ? 'linear-gradient(90deg, #34d399, #06b6d4)'
                                            : 'linear-gradient(90deg, #f87171, #f97316)'
                                    }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="glass-sm rounded-xl p-3">
                                    <div className="text-white/15 text-[9px] font-mono mb-1">SEVERITY</div>
                                    <div className="text-sm font-bold" style={{
                                        color: result.severity === 'Critical' ? '#f87171' : result.severity === 'High' ? '#fbbf24' : '#34d399'
                                    }}>● {result.severity}</div>
                                </div>
                                <div className="glass-sm rounded-xl p-3">
                                    <div className="text-white/15 text-[9px] font-mono mb-1">MODEL</div>
                                    <div className="text-white/60 text-sm font-mono">{result.model_status}</div>
                                </div>
                            </div>

                            {result.advisory && (
                                <div className="space-y-3">
                                    <div className="glass-sm rounded-xl p-4 border-l-2 border-[#a78bfa]">
                                        <div className="text-[#a78bfa] text-[10px] font-mono tracking-widest mb-2">TREATMENT</div>
                                        <div className="text-white/70 text-xs leading-relaxed">{result.advisory.treatment}</div>
                                    </div>
                                    <div className="glass-sm rounded-xl p-4 border-l-2 border-[#06b6d4]">
                                        <div className="text-[#06b6d4] text-[10px] font-mono tracking-widest mb-2">PREVENTION</div>
                                        <div className="text-white/70 text-xs leading-relaxed">{result.advisory.prevention}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-16 text-white/10">
                            <div className="text-5xl mb-4 animate-float">🦠</div>
                            <div className="font-mono text-sm">Upload or capture a leaf image</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
