"use client";

import { useScroll, useTransform, motion, useSpring } from "framer-motion";
import { Globe } from "@/components/Globe";
import {
  Sprout,
  ChevronRight,
  Droplets,
  TrendingUp,
  Leaf,
  Waves,
  HandCoins,
  UtensilsCrossed,
  User,
  Lock,
  Mail,
  ArrowDown
} from "lucide-react";
import { useRef, useState } from "react";

const SDGs = [
  {
    goal: "Goal 1",
    title: "No Poverty",
    icon: <HandCoins className="w-8 h-8 text-red-500" />,
    desc: "Empowering small-holder farmers with financial intelligence and market access."
  },
  {
    goal: "Goal 2",
    title: "Zero Hunger",
    icon: <UtensilsCrossed className="w-8 h-8 text-orange-500" />,
    desc: "Optimizing crop yields through AI-driven insights to ensure food security."
  },
  {
    goal: "Goal 8",
    title: "Decent Work & Economic Growth",
    icon: <TrendingUp className="w-8 h-8 text-emerald-500" />,
    desc: "Formalizing agricultural labor and creating sustainable economic opportunities."
  },
  {
    goal: "Goal 12",
    title: "Responsible Consumption & Production",
    icon: <Leaf className="w-8 h-8 text-green-600" />,
    desc: "Reducing post-harvest losses and promoting sustainable farming practices."
  }
];

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const globeRotation = useTransform(smoothProgress, [0, 1], [0, 1]);
  const globeScale = useTransform(smoothProgress, [0, 0.1, 0.8, 1], [1, 1.1, 1.1, 0.7]);
  const globeOpacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0.3, 0.5, 0.5, 0.1]);

  const [isLogin, setIsLogin] = useState(true);

  return (
    <div ref={containerRef} className="relative bg-[#020617] text-white">
      {/* Fixed Globe Container */}
      <motion.div
        style={{ scale: globeScale, opacity: globeOpacity }}
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center"
      >
        <div className="w-[800px] h-[800px]">
          <Globe size={800} scrollRotation={smoothProgress.get()} />
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-8 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-8"
        >
          <Sprout className="w-4 h-4" />
          Sustainable Farmer Companion
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-8xl md:text-9xl font-black mb-6 tracking-tighter"
        >
          Lefora<span className="text-emerald-500">.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-12 font-medium"
        >
          The personal multi-farmer assistant. Empowering the hands that feed the world through sustainable technology.
        </motion.p>


        <div className="absolute bottom-6 flex flex-col items-center gap-2 text-slate-500/50 animate-bounce">
          <span className="text-[10px] uppercase tracking-widest font-bold">Scroll Impact</span>
          <ArrowDown className="w-3 h-3" />
        </div>
      </section>

      {/* Condensed SDG Bulletin Section */}
      <section className="relative z-10 px-8 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">Our Sustainable <span className="gradient-text">Bulletins</span></h2>
          <p className="text-slate-400 text-sm">Targeted impact goals for a sustainable tomorrow.</p>
        </div>

        <div className="relative space-y-4">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 -translate-x-1/2 hidden md:block" />

          {SDGs.map((sdg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: "-100px" }}
              className={`flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
            >
              {/* Content Card */}
              <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                <div className="glass p-6 md:p-8 hover:border-emerald-500/30 transition-all group">
                  <div className={`text-emerald-500 font-bold text-xs uppercase mb-2 ${i % 2 === 0 ? 'md:justify-end' : 'md:justify-start'} flex items-center gap-2`}>
                    {i % 2 === 0 && sdg.goal}
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    {i % 2 !== 0 && sdg.goal}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">{sdg.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{sdg.desc}</p>
                </div>
              </div>

              {/* Central Bulletin Node */}
              <div className="relative z-20 flex-shrink-0 w-20 h-20 rounded-full glass border-2 border-emerald-500/20 flex items-center justify-center bg-[#020617] group hover:border-emerald-500 transition-colors cursor-help">
                <div className="absolute inset-0 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 animate-pulse" />
                {sdg.icon}
              </div>

              {/* Spacer for offset grid feel */}
              <div className="flex-1 hidden md:block" />
            </motion.div>
          ))}
        </div>
      </section>



      {/* Login / Register Page */}
      <section className="relative py-16 flex items-center justify-center px-8 z-20 bg-[#020617]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="glass p-8 md:p-12 space-y-8 border-emerald-500/20">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h3>
              <p className="text-slate-400 text-sm">
                {isLogin ? "Lefora Farmer Assistant Dashboard" : "Join the sustainable farming revolution"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <button className="w-full py-4 rounded-xl bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                {isLogin ? "Login to Lefora" : "Create Account"}
              </button>
            </form>

            <div className="relative py-4 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-xs text-slate-500 uppercase font-bold">Or continue with</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="glass py-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-sm font-semibold">
                Google
              </button>
              <button className="glass py-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-sm font-semibold">
                FarmerID
              </button>
            </div>

            <p className="text-center text-sm text-slate-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-emerald-400 font-bold hover:underline"
              >
                {isLogin ? "Register Now" : "Login"}
              </button>
            </p>
          </div>
        </motion.div>
      </section>

      {/* Decorative Blur */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
}
