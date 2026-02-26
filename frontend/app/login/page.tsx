"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push("/");
            }
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#080d14] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a2d45_0%,_transparent_70%)] opacity-30"></div>

            <div className="relative w-full max-w-md bg-[#0c1620] border border-[#1a2d45] rounded-2xl p-8 shadow-2xl slide-in">

                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🌱</div>
                    <div className="text-[#e8f0fe] text-2xl font-bold tracking-tight">AgriAI Nexus</div>
                    <div className="text-[#4a6a8a] text-xs font-mono tracking-wider mt-2 uppercase">
                        {isSignUp ? "Register neural identity" : "Authenticate neural identity"}
                    </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {errorMsg && (
                        <div className="bg-[#ff453a11] border border-[#ff453a55] text-[#ff453a] text-xs p-3 rounded-lg text-center font-mono">
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label className="block text-[#6b7a90] text-[10px] font-mono mb-1.5 uppercase tracking-wider">Communication Vector (Email)</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#080d14] border border-[#1a2d45] focus:border-[#00e5ff] text-[#e8f0fe] text-sm rounded-lg p-3 outline-none transition-colors placeholder:text-[#2a4a6a]"
                            placeholder="operator@agri.ai"
                        />
                    </div>

                    <div>
                        <label className="block text-[#6b7a90] text-[10px] font-mono mb-1.5 uppercase tracking-wider">Access Cipher (Password)</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#080d14] border border-[#1a2d45] focus:border-[#00e5ff] text-[#e8f0fe] text-sm rounded-lg p-3 outline-none transition-colors placeholder:text-[#2a4a6a]"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-[#00e5ff] text-[#080d14] font-bold tracking-widest text-xs font-mono uppercase py-3.5 rounded-lg hover:bg-[#00cce6] transition-colors disabled:opacity-50"
                    >
                        {loading ? "INITIALIZING..." : isSignUp ? "ESTABLISH IDENTITY" : "GRANT ACCESS"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }}
                        className="text-[#4a6a8a] hover:text-[#00e5ff] text-xs transition-colors font-mono"
                    >
                        {isSignUp ? "— Return to Authentication —" : "— Register New Vector —"}
                    </button>
                </div>

            </div>
        </div>
    );
}
