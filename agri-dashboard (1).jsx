import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PolarRadiusAxis,
  ComposedChart, ReferenceLine
} from "recharts";

// ── Simulated live data generators ──────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));

const genWeather = () => ({
  temp: +(rand(22, 38)).toFixed(1),
  humidity: +(rand(45, 85)).toFixed(1),
  rainfall: +(rand(0, 12)).toFixed(2),
  wind: +(rand(4, 28)).toFixed(1),
  uv: randInt(3, 11),
  soilMoisture: +(rand(18, 72)).toFixed(1),
  pressure: +(rand(1008, 1022)).toFixed(0),
});

const CROPS = ["Rice", "Wheat", "Cotton", "Sugarcane", "Soybean", "Maize", "Groundnut", "Turmeric"];
const DISEASES = ["Leaf Blight", "Powdery Mildew", "Root Rot", "Rust Fungus", "Aphid Infestation"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const SEV_COLORS = { Critical: "#ff2d55", High: "#ff9f0a", Medium: "#ffd60a", Low: "#30d158" };

const genFarms = () => [
  { id: 1, name: "North Field Alpha", crop: "Rice", acres: 42, lat: 17.38, lng: 78.47, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Flowering", alert: Math.random() > 0.5 },
  { id: 2, name: "South Block Beta", crop: "Cotton", acres: 67, lat: 17.12, lng: 78.21, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Boll Formation", alert: Math.random() > 0.6 },
  { id: 3, name: "East Parcel Gamma", crop: "Wheat", acres: 31, lat: 17.55, lng: 78.62, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Tillering", alert: Math.random() > 0.7 },
  { id: 4, name: "West Zone Delta", crop: "Sugarcane", acres: 88, lat: 17.29, lng: 78.05, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Grand Growth", alert: Math.random() > 0.4 },
  { id: 5, name: "Central Hub Epsilon", crop: "Soybean", acres: 55, lat: 17.44, lng: 78.35, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Pod Fill", alert: Math.random() > 0.65 },
];

const genPriceForecast = (crop) => {
  const base = { Rice: 1800, Wheat: 2100, Cotton: 6200, Sugarcane: 340, Soybean: 4100, Maize: 1650 }[crop] || 2000;
  return Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    price: Math.round(base + rand(-200, 400) + i * rand(5, 25)),
    forecast: Math.round(base + rand(-100, 500) + i * rand(10, 35)),
    low: Math.round(base - rand(100, 300)),
    high: Math.round(base + rand(200, 600)),
  }));
};

const genRiskTrend = () => Array.from({ length: 7 }, (_, i) => ({
  day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
  rice: +(rand(0.1, 0.9)).toFixed(2),
  cotton: +(rand(0.1, 0.9)).toFixed(2),
  wheat: +(rand(0.1, 0.9)).toFixed(2),
  avg: +(rand(0.15, 0.75)).toFixed(2),
}));

const genSoilData = () => [
  { subject: "N (Nitrogen)", A: randInt(30, 80), fullMark: 100 },
  { subject: "P (Phosphorus)", A: randInt(20, 70), fullMark: 100 },
  { subject: "K (Potassium)", A: randInt(40, 90), fullMark: 100 },
  { subject: "pH Level", A: randInt(55, 80), fullMark: 100 },
  { subject: "Organic Matter", A: randInt(25, 65), fullMark: 100 },
  { subject: "Moisture", A: randInt(30, 85), fullMark: 100 },
];

const genNDVIHistory = () => Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  ndvi: +(rand(0.35, 0.85)).toFixed(3),
  evi: +(rand(0.25, 0.70)).toFixed(3),
  threshold: 0.4,
}));

const genYieldHistory = () => ["2019","2020","2021","2022","2023","2024"].map(year => ({
  year,
  rice: randInt(2800, 4200),
  cotton: randInt(1500, 2800),
  wheat: randInt(3100, 4600),
  soybean: randInt(1800, 2900),
}));

const genIrrigation = () => Array.from({ length: 14 }, (_, i) => ({
  day: `D${i+1}`,
  required: +(rand(12, 38)).toFixed(1),
  applied: +(rand(10, 40)).toFixed(1),
  deficit: +(rand(0, 8)).toFixed(1),
}));

const genAlerts = () => [
  { id:1, type:"Disease", farm:"North Field Alpha", msg:"Leaf Blight detected in Zone 3", sev:"Critical", time:"2m ago", icon:"🦠" },
  { id:2, type:"Weather", farm:"South Block Beta", msg:"Cyclonic winds forecast — 72hr window", sev:"High", time:"14m ago", icon:"🌪" },
  { id:3, type:"Irrigation", farm:"West Zone Delta", msg:"Soil moisture critically low — irrigate", sev:"High", time:"31m ago", icon:"💧" },
  { id:4, type:"Market", farm:"All Farms", msg:"Cotton price surge +12% — sell window open", sev:"Low", time:"1h ago", icon:"📈" },
  { id:5, type:"Pest", farm:"East Parcel Gamma", msg:"Aphid colony expansion detected", sev:"Medium", time:"2h ago", icon:"🐛" },
  { id:6, type:"Yield", farm:"Central Hub Epsilon", msg:"Yield projection revised down 8%", sev:"Medium", time:"3h ago", icon:"⚠️" },
];

const MARKET_DATA = CROPS.slice(0,6).map(c => ({
  name: c,
  price: randInt(1500, 7000),
  change: +(rand(-8, 12)).toFixed(2),
  vol: randInt(1000, 9000),
  high: randInt(5000, 9000),
  low: randInt(1200, 4000),
}));

// ── Components ───────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, unit, change, color, sub }) => (
  <div style={{
    background: "linear-gradient(135deg, #0f1923 0%, #141f2e 100%)",
    border: `1px solid ${color}22`,
    borderRadius: 12,
    padding: "14px 18px",
    position: "relative",
    overflow: "hidden",
    flex: 1,
    minWidth: 140,
  }}>
    <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:`radial-gradient(circle, ${color}18 0%, transparent 70%)` }} />
    <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
    <div style={{ color:"#6b7a90", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"'JetBrains Mono', monospace" }}>{label}</div>
    <div style={{ color:"#e8f0fe", fontSize:24, fontWeight:700, fontFamily:"'JetBrains Mono', monospace", marginTop:2 }}>
      {value}<span style={{ fontSize:12, color:"#6b7a90", marginLeft:3 }}>{unit}</span>
    </div>
    {change !== undefined && (
      <div style={{ color: change >= 0 ? "#30d158" : "#ff453a", fontSize:11, fontFamily:"'JetBrains Mono', monospace" }}>
        {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
      </div>
    )}
    {sub && <div style={{ color:"#4a5568", fontSize:10, marginTop:2 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, sub, accent="#00e5ff" }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:3, height:18, background:accent, borderRadius:2 }} />
      <span style={{ color:"#e8f0fe", fontSize:14, fontWeight:700, letterSpacing:1, fontFamily:"'JetBrains Mono', monospace", textTransform:"uppercase" }}>{title}</span>
    </div>
    {sub && <div style={{ color:"#4a5568", fontSize:11, marginTop:3, paddingLeft:11 }}>{sub}</div>}
  </div>
);

const RiskBar = ({ value, label }) => {
  const color = value > 0.7 ? "#ff2d55" : value > 0.4 ? "#ff9f0a" : "#30d158";
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ color:"#8899aa", fontSize:11, fontFamily:"'JetBrains Mono', monospace" }}>{label}</span>
        <span style={{ color, fontSize:11, fontFamily:"'JetBrains Mono', monospace" }}>{(value*100).toFixed(0)}%</span>
      </div>
      <div style={{ background:"#1a2535", borderRadius:4, height:6, overflow:"hidden" }}>
        <div style={{ width:`${value*100}%`, height:"100%", background:`linear-gradient(90deg, ${color}88, ${color})`, borderRadius:4, transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
};

const Badge = ({ text, color }) => (
  <span style={{ background:`${color}22`, color, border:`1px solid ${color}44`, borderRadius:4, padding:"2px 6px", fontSize:10, fontFamily:"'JetBrains Mono', monospace", letterSpacing:0.5 }}>{text}</span>
);

const TOOLTIP_STYLE = { background:"#0d1520", border:"1px solid #1e3a5f", borderRadius:8, color:"#e8f0fe", fontSize:11 };

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function AgriAIDashboard() {
  const [weather, setWeather] = useState(genWeather());
  const [farms, setFarms] = useState(genFarms());
  const [selectedFarm, setSelectedFarm] = useState(1);
  const [priceCrop, setPriceCrop] = useState("Rice");
  const [priceData, setPriceData] = useState(genPriceForecast("Rice"));
  const [riskTrend, setRiskTrend] = useState(genRiskTrend());
  const [soilData, setSoilData] = useState(genSoilData());
  const [ndviData, setNdviData] = useState(genNDVIHistory());
  const [yieldData, setYieldData] = useState(genYieldHistory());
  const [irrigData, setIrrigData] = useState(genIrrigation());
  const [alerts] = useState(genAlerts());
  const [activeTab, setActiveTab] = useState("overview");
  const [tick, setTick] = useState(0);
  const [mapClick, setMapClick] = useState({ lat: 17.1391, lng: 78.2073 });
  const [liveLog, setLiveLog] = useState([
    "[ SYS ] Satellite uplink established — Sentinel-2 band NDVI streaming",
    "[ ML  ] XGBoost inference engine loaded — 847ms startup",
    "[ DB  ] Supabase realtime channel subscribed",
    "[ API ] OpenWeatherMap feed active — 5min polling",
  ]);
  const logRef = useRef(null);

  // Live updates every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(genWeather());
      setTick(t => t + 1);
      if (tick % 2 === 0) setFarms(genFarms());
      if (tick % 4 === 0) setRiskTrend(genRiskTrend());
      if (tick % 5 === 0) setSoilData(genSoilData());
      if (tick % 6 === 0) setNdviData(genNDVIHistory());
      // Append live log
      const logs = [
        `[ SEN ] NDVI update: Farm #${randInt(1,6)} — ${rand(0.3,0.9).toFixed(3)}`,
        `[ ML  ] Risk score recalculated: ${rand(0.1,0.95).toFixed(3)}`,
        `[ WX  ] Temp spike: ${rand(30,40).toFixed(1)}°C @ lat ${rand(16,18).toFixed(4)}`,
        `[ DB  ] Alert row inserted — severity: ${SEVERITIES[randInt(0,4)]}`,
        `[ API ] Mandi price update: ${CROPS[randInt(0,8)]} ₹${randInt(1500,6000)}`,
        `[ IRR ] Irrigation trigger: ${rand(15,35).toFixed(1)}mm recommended`,
      ];
      setLiveLog(prev => [...prev.slice(-20), logs[randInt(0, logs.length)]]);
    }, 3000);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [liveLog]);

  const farm = farms.find(f => f.id === selectedFarm);

  const handleCropChange = (c) => {
    setPriceCrop(c);
    setPriceData(genPriceForecast(c));
  };

  const NAV = [
    { id:"overview", label:"Overview", icon:"⬡" },
    { id:"farms", label:"Farm Intel", icon:"🌾" },
    { id:"risk", label:"Risk Engine", icon:"⚡" },
    { id:"market", label:"Market AI", icon:"📊" },
    { id:"disease", label:"Disease Scan", icon:"🦠" },
    { id:"irrigation", label:"Irrigation", icon:"💧" },
    { id:"soil", label:"Soil Matrix", icon:"🔬" },
    { id:"alerts", label:"Alert Feed", icon:"🔔" },
  ];

  return (
    <div style={{
      minHeight:"100vh",
      background:"#080d14",
      fontFamily:"'JetBrains Mono', 'Fira Code', monospace",
      color:"#c8d8e8",
      display:"flex",
      flexDirection:"column",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;600;700;900&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#0a1018; }
        ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:2px; }
        .nav-item { transition: all 0.2s; cursor:pointer; }
        .nav-item:hover { background: #0f2030 !important; }
        .nav-item.active { background: linear-gradient(90deg, #002a3a, #001520) !important; border-left-color: #00e5ff !important; }
        .farm-row:hover { background: #0f1e2d !important; cursor:pointer; }
        .tab-btn { transition: all 0.2s; cursor:pointer; }
        .tab-btn:hover { border-color:#00e5ff !important; color:#00e5ff !important; }
        .tab-btn.active { background:#00e5ff22 !important; border-color:#00e5ff !important; color:#00e5ff !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .pulse { animation: pulse 2s infinite; }
        .slide-in { animation: slideIn 0.3s ease; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background:"linear-gradient(180deg, #0a1420 0%, #080d14 100%)",
        borderBottom:"1px solid #1a2d45",
        padding:"0 24px",
        height:56,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{
            width:34, height:34, borderRadius:8,
            background:"linear-gradient(135deg, #00e5ff22, #00e5ff44)",
            border:"1px solid #00e5ff55",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16,
          }}>🌿</div>
          <div>
            <div style={{ color:"#00e5ff", fontSize:15, fontWeight:700, fontFamily:"'Outfit', sans-serif", letterSpacing:0.5 }}>AgriAI Command Center</div>
            <div style={{ color:"#2a4a6a", fontSize:9, letterSpacing:2 }}>NEURAL AGRICULTURAL INTELLIGENCE PLATFORM v2.4.1</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:16, background:"#00e5ff11", border:"1px solid #00e5ff33", borderRadius:20, padding:"3px 10px" }}>
            <div className="pulse" style={{ width:6, height:6, borderRadius:"50%", background:"#00e5ff" }} />
            <span style={{ color:"#00e5ff", fontSize:10, letterSpacing:1 }}>LIVE SYNC ACTIVE</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"#6b7a90", fontSize:9, letterSpacing:2 }}>SYSTEM NODES</div>
            <div style={{ color:"#30d158", fontSize:11 }}>● ALL 14 ONLINE</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"#6b7a90", fontSize:9, letterSpacing:2 }}>ACTIVE ALERTS</div>
            <div style={{ color:"#ff9f0a", fontSize:11 }}>⚠ 6 PENDING</div>
          </div>
          <div style={{
            width:34, height:34, borderRadius:"50%",
            background:"linear-gradient(135deg, #1a3a5a, #0d2030)",
            border:"1px solid #1e3a5f",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, cursor:"pointer",
          }}>👤</div>
        </div>
      </div>

      <div style={{ display:"flex", flex:1 }}>
        {/* ── SIDEBAR ── */}
        <div style={{
          width:200,
          background:"linear-gradient(180deg, #0a1420 0%, #080e18 100%)",
          borderRight:"1px solid #1a2d45",
          padding:"16px 0",
          display:"flex", flexDirection:"column",
          position:"sticky", top:56, height:"calc(100vh - 56px)",
          overflow:"hidden",
        }}>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item ${activeTab===n.id?"active":""}`}
              onClick={() => setActiveTab(n.id)}
              style={{
                padding:"10px 16px",
                borderLeft:"3px solid transparent",
                display:"flex", alignItems:"center", gap:10,
              }}>
              <span style={{ fontSize:14 }}>{n.icon}</span>
              <span style={{ fontSize:11, color: activeTab===n.id?"#00e5ff":"#5a7a9a", letterSpacing:0.5 }}>{n.label}</span>
            </div>
          ))}

          <div style={{ marginTop:"auto", padding:"12px 16px", borderTop:"1px solid #1a2d45" }}>
            <div style={{ color:"#2a4a6a", fontSize:9, letterSpacing:2, marginBottom:6 }}>SELECTED FARM</div>
            <div style={{ color:"#00e5ff", fontSize:11 }}>{farm?.name}</div>
            <div style={{ color:"#4a6a8a", fontSize:10 }}>{farm?.crop} · {farm?.acres}ac</div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex:1, padding:20, overflow:"auto", maxHeight:"calc(100vh - 56px)" }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="slide-in">
              {/* Weather metrics row */}
              <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                <MetricCard icon="🌡" label="Temperature" value={weather.temp} unit="°C" change={2.4} color="#ff9f0a" />
                <MetricCard icon="💧" label="Humidity" value={weather.humidity} unit="%" change={-1.2} color="#0096ff" />
                <MetricCard icon="🌧" label="Rainfall 24h" value={weather.rainfall} unit="mm" color="#5e5ce6" />
                <MetricCard icon="💨" label="Wind Speed" value={weather.wind} unit="km/h" change={4.1} color="#64d2ff" />
                <MetricCard icon="🌱" label="Soil Moisture" value={weather.soilMoisture} unit="%" change={-3.2} color="#30d158" />
                <MetricCard icon="☀️" label="UV Index" value={weather.uv} unit="" sub="Wear protection > 6" color="#ffd60a" />
                <MetricCard icon="📡" label="Pressure" value={weather.pressure} unit="hPa" color="#bf5af2" />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.2fr", gap:16, marginBottom:16 }}>
                {/* Risk Trend */}
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="7-Day Risk Telemetry" sub="Failure probability by crop" accent="#ff453a" />
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={riskTrend}>
                      <defs>
                        <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff453a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ff453a" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff9f0a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ff9f0a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="day" tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:10 }} domain={[0,1]} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="rice" stroke="#ff453a" fill="url(#rg1)" strokeWidth={2} name="Rice" />
                      <Area type="monotone" dataKey="cotton" stroke="#ff9f0a" fill="url(#rg2)" strokeWidth={2} name="Cotton" />
                      <Area type="monotone" dataKey="wheat" stroke="#30d158" fill="none" strokeWidth={2} name="Wheat" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* NDVI Satellite */}
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="NDVI Satellite Stream" sub="30-day vegetation index" accent="#30d158" />
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={ndviData.slice(0,20)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="day" tick={{ fill:"#4a6a8a", fontSize:9 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:9 }} domain={[0,1]} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <ReferenceLine y={0.4} stroke="#ff453a" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="ndvi" stroke="#30d158" fill="#30d15822" strokeWidth={2} name="NDVI" />
                      <Line type="monotone" dataKey="evi" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="EVI" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Yield History */}
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Historical Yield" sub="Tonnes per hectare 2019–2024" accent="#bf5af2" />
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={yieldData} barSize={10}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="year" tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="rice" fill="#00e5ff" radius={[2,2,0,0]} name="Rice" />
                      <Bar dataKey="cotton" fill="#ff9f0a" radius={[2,2,0,0]} name="Cotton" />
                      <Bar dataKey="wheat" fill="#30d158" radius={[2,2,0,0]} name="Wheat" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16 }}>
                {/* Farm Status Table */}
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Farm Status Matrix" sub="All active zones — real-time telemetry" />
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr>
                        {["Farm","Crop","Acres","Risk","Moisture","NDVI","Health","Stage"].map(h => (
                          <th key={h} style={{ color:"#4a6a8a", textAlign:"left", padding:"6px 8px", borderBottom:"1px solid #1a2d45", fontSize:9, letterSpacing:1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {farms.map(f => (
                        <tr key={f.id} className="farm-row"
                          onClick={() => setSelectedFarm(f.id)}
                          style={{ background: selectedFarm===f.id?"#0f2030":"transparent", transition:"background 0.2s" }}>
                          <td style={{ padding:"7px 8px", color:"#c8d8e8", whiteSpace:"nowrap" }}>
                            {f.alert && <span style={{ marginRight:4 }}>🔴</span>}
                            {f.name.split(" ").slice(0,2).join(" ")}
                          </td>
                          <td style={{ padding:"7px 8px", color:"#00e5ff" }}>{f.crop}</td>
                          <td style={{ padding:"7px 8px", color:"#6b7a90" }}>{f.acres}</td>
                          <td style={{ padding:"7px 8px" }}>
                            <span style={{ color: f.risk>0.7?"#ff453a":f.risk>0.4?"#ff9f0a":"#30d158" }}>{(f.risk*100).toFixed(0)}%</span>
                          </td>
                          <td style={{ padding:"7px 8px", color:"#5e9fe0" }}>{f.moisture.toFixed(0)}%</td>
                          <td style={{ padding:"7px 8px", color:"#30d158" }}>{f.ndvi.toFixed(2)}</td>
                          <td style={{ padding:"7px 8px", color:"#c8d8e8" }}>{f.health}%</td>
                          <td style={{ padding:"7px 8px", color:"#bf5af2", fontSize:9 }}>{f.stage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Live Alerts */}
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Alert Feed" sub="AI-generated warnings" accent="#ff453a" />
                  <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:280, overflow:"auto" }}>
                    {alerts.map(a => (
                      <div key={a.id} style={{
                        background:"#0a1520",
                        border:`1px solid ${SEV_COLORS[a.sev]}33`,
                        borderLeft:`3px solid ${SEV_COLORS[a.sev]}`,
                        borderRadius:8, padding:"8px 10px",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ color:SEV_COLORS[a.sev], fontSize:10, fontWeight:700 }}>{a.icon} {a.type}</span>
                          <span style={{ color:"#2a4a6a", fontSize:9 }}>{a.time}</span>
                        </div>
                        <div style={{ color:"#c8d8e8", fontSize:11 }}>{a.msg}</div>
                        <div style={{ color:"#4a6a8a", fontSize:9, marginTop:2 }}>{a.farm}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FARM INTEL TAB ── */}
          {activeTab === "farms" && (
            <div className="slide-in">
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                {farms.map(f => (
                  <div key={f.id} onClick={() => setSelectedFarm(f.id)}
                    style={{
                      background: selectedFarm===f.id ? "linear-gradient(135deg, #002a3a, #001e30)" : "#0c1620",
                      border:`1px solid ${selectedFarm===f.id?"#00e5ff":"#1a2d45"}`,
                      borderRadius:10, padding:"10px 14px", cursor:"pointer",
                      transition:"all 0.2s",
                    }}>
                    <div style={{ color: selectedFarm===f.id?"#00e5ff":"#8899aa", fontSize:11, fontWeight:700 }}>{f.name}</div>
                    <div style={{ color:"#4a6a8a", fontSize:10 }}>{f.crop} · {f.acres} acres</div>
                  </div>
                ))}
              </div>

              {farm && (
                <>
                  <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                    <MetricCard icon="⚠️" label="Failure Risk" value={(farm.risk*100).toFixed(0)} unit="%" color={farm.risk>0.7?"#ff453a":farm.risk>0.4?"#ff9f0a":"#30d158"} />
                    <MetricCard icon="💧" label="Soil Moisture" value={farm.moisture.toFixed(0)} unit="%" color="#0096ff" />
                    <MetricCard icon="🛰" label="NDVI Index" value={farm.ndvi.toFixed(3)} unit="" color="#30d158" />
                    <MetricCard icon="❤️" label="Crop Health" value={farm.health} unit="%" color="#ff2d55" />
                    <MetricCard icon="🌾" label="Growth Stage" value={farm.stage} unit="" color="#bf5af2" />
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                      <SectionHeader title="NDVI Time Series" sub="Vegetation health over 30 days" accent="#30d158" />
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={ndviData}>
                          <defs>
                            <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#30d158" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#30d158" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                          <XAxis dataKey="day" tick={{ fill:"#4a6a8a", fontSize:9 }} />
                          <YAxis tick={{ fill:"#4a6a8a", fontSize:9 }} domain={[0,1]} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <ReferenceLine y={0.4} stroke="#ff453a" strokeDasharray="4 4" label={{ value:"Critical", fill:"#ff453a", fontSize:9 }} />
                          <Area type="monotone" dataKey="ndvi" stroke="#30d158" fill="url(#ndviGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                      <SectionHeader title="Risk Score History" sub="7-day failure probability trend" accent="#ff453a" />
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={riskTrend}>
                          <defs>
                            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff453a" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#ff453a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                          <XAxis dataKey="day" tick={{ fill:"#4a6a8a", fontSize:9 }} />
                          <YAxis tick={{ fill:"#4a6a8a", fontSize:9 }} domain={[0,1]} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <ReferenceLine y={0.7} stroke="#ff9f0a" strokeDasharray="4 4" />
                          <Area type="monotone" dataKey="avg" stroke="#ff453a" fill="url(#riskGrad)" strokeWidth={2} name="Risk" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                    <SectionHeader title="Risk Factor Breakdown" sub="Multi-dimensional failure analysis" accent="#ff9f0a" />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        {[
                          { label:"Weather Risk", value: farm.risk * rand(0.7,1.2) },
                          { label:"Soil Degradation", value: rand(0.1, 0.8) },
                          { label:"Pest Pressure", value: rand(0.05, 0.6) },
                          { label:"Drought Index", value: rand(0.1, 0.9) },
                          { label:"Flood Probability", value: rand(0.05, 0.5) },
                          { label:"Nutrient Deficiency", value: rand(0.1, 0.7) },
                        ].map(r => <RiskBar key={r.label} value={Math.min(r.value, 1)} label={r.label} />)}
                      </div>
                      <div>
                        <div style={{ marginBottom:8, color:"#6b7a90", fontSize:10, letterSpacing:1 }}>GEOSPATIAL COORDINATES</div>
                        <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:13, color:"#00e5ff" }}>
                          LAT: {farm.lat.toFixed(4)}  LNG: {farm.lng.toFixed(4)}
                        </div>
                        <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:6 }}>
                          {[
                            { k:"Crop", v:farm.crop },
                            { k:"Area", v:`${farm.acres} acres` },
                            { k:"Stage", v:farm.stage },
                            { k:"Health Score", v:`${farm.health}/100` },
                            { k:"Soil Moisture", v:`${farm.moisture.toFixed(1)}%` },
                            { k:"NDVI", v:farm.ndvi.toFixed(3) },
                          ].map(row => (
                            <div key={row.k} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #1a2d45" }}>
                              <span style={{ color:"#4a6a8a", fontSize:11 }}>{row.k}</span>
                              <span style={{ color:"#c8d8e8", fontSize:11 }}>{row.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── RISK ENGINE TAB ── */}
          {activeTab === "risk" && (
            <div className="slide-in">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16, gridColumn:"1 / span 2" }}>
                  <SectionHeader title="Multi-Farm Risk Matrix" sub="CNN + LSTM + XGBoost ensemble output" accent="#ff453a" />
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={farms.map(f => ({ name:f.name.split(" ")[0], risk:(f.risk*100).toFixed(0), health:f.health, moisture:f.moisture.toFixed(0) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="name" tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize:10, color:"#6b7a90" }} />
                      <Bar dataKey="risk" fill="#ff453a" name="Risk Score %" radius={[3,3,0,0]} />
                      <Bar dataKey="health" fill="#30d158" name="Health Score" radius={[3,3,0,0]} />
                      <Bar dataKey="moisture" fill="#0096ff" name="Soil Moisture %" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Risk Distribution" sub="Severity bands" accent="#ff9f0a" />
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
                    {[
                      { label:"Critical (>70%)", count: farms.filter(f=>f.risk>0.7).length, color:"#ff2d55" },
                      { label:"High (50–70%)", count: farms.filter(f=>f.risk>0.5&&f.risk<=0.7).length, color:"#ff9f0a" },
                      { label:"Medium (30–50%)", count: farms.filter(f=>f.risk>0.3&&f.risk<=0.5).length, color:"#ffd60a" },
                      { label:"Low (<30%)", count: farms.filter(f=>f.risk<=0.3).length, color:"#30d158" },
                    ].map(b => (
                      <div key={b.label}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ color:b.color, fontSize:11 }}>{b.label}</span>
                          <span style={{ color:"#c8d8e8", fontSize:11 }}>{b.count} farms</span>
                        </div>
                        <div style={{ background:"#1a2535", borderRadius:4, height:8 }}>
                          <div style={{ width:`${(b.count/farms.length)*100}%`, height:"100%", background:b.color, borderRadius:4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:20, padding:12, background:"#0a1520", borderRadius:8, border:"1px solid #ff453a33" }}>
                    <div style={{ color:"#ff453a", fontSize:10, letterSpacing:1, marginBottom:4 }}>ML MODEL STATUS</div>
                    <div style={{ color:"#6b7a90", fontSize:10 }}>CNN (satellite): <span style={{ color:"#30d158" }}>● ACTIVE</span></div>
                    <div style={{ color:"#6b7a90", fontSize:10 }}>LSTM (weather): <span style={{ color:"#30d158" }}>● ACTIVE</span></div>
                    <div style={{ color:"#6b7a90", fontSize:10 }}>XGBoost (tabular): <span style={{ color:"#30d158" }}>● ACTIVE</span></div>
                    <div style={{ color:"#6b7a90", fontSize:10 }}>Ensemble fusion: <span style={{ color:"#ff9f0a" }}>● CALIBRATING</span></div>
                  </div>
                </div>
              </div>

              <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                <SectionHeader title="7-Day Risk Forecast — All Crops" sub="Ensemble model prediction with uncertainty bands" accent="#ff453a" />
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={riskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                    <XAxis dataKey="day" tick={{ fill:"#4a6a8a", fontSize:10 }} />
                    <YAxis tick={{ fill:"#4a6a8a", fontSize:10 }} domain={[0,1]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize:10, color:"#6b7a90" }} />
                    <ReferenceLine y={0.7} stroke="#ff453a" strokeDasharray="4 4" label={{ value:"Critical Threshold", fill:"#ff453a", fontSize:9, position:"insideTopRight" }} />
                    <Area type="monotone" dataKey="rice" stroke="#ff453a" fill="#ff453a22" strokeWidth={2} name="Rice" />
                    <Line type="monotone" dataKey="cotton" stroke="#ff9f0a" strokeWidth={2} dot={false} name="Cotton" />
                    <Line type="monotone" dataKey="wheat" stroke="#30d158" strokeWidth={2} dot={false} name="Wheat" />
                    <Line type="monotone" dataKey="avg" stroke="#00e5ff" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Average" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── MARKET TAB ── */}
          {activeTab === "market" && (
            <div className="slide-in">
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                {CROPS.map(c => (
                  <button key={c} className={`tab-btn ${priceCrop===c?"active":""}`}
                    onClick={() => handleCropChange(c)}
                    style={{
                      background:"#0c1620", border:"1px solid #1a2d45", borderRadius:6,
                      color:"#6b7a90", padding:"6px 14px", fontSize:11, cursor:"pointer",
                    }}>
                    {c}
                  </button>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16, marginBottom:16 }}>
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title={`${priceCrop} — Price Forecast`} sub="ARIMA + LSTM 12-month projection (₹/quintal)" accent="#ffd60a" />
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={priceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="month" tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `₹${v}`} />
                      <Legend wrapperStyle={{ fontSize:10, color:"#6b7a90" }} />
                      <Area type="monotone" dataKey="high" stroke="none" fill="#30d15822" name="High Band" />
                      <Area type="monotone" dataKey="low" stroke="none" fill="#ff453a22" name="Low Band" />
                      <Line type="monotone" dataKey="price" stroke="#ffd60a" strokeWidth={2} dot={{ r:3, fill:"#ffd60a" }} name="Market Price" />
                      <Line type="monotone" dataKey="forecast" stroke="#00e5ff" strokeWidth={2} strokeDasharray="5 3" dot={false} name="AI Forecast" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Live Mandi Prices" sub="All crops — real-time" accent="#ffd60a" />
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr>
                        {["Crop","Price","Chg%","Volume"].map(h => (
                          <th key={h} style={{ color:"#4a6a8a", textAlign:"left", padding:"5px 6px", borderBottom:"1px solid #1a2d45", fontSize:9, letterSpacing:1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MARKET_DATA.map(m => (
                        <tr key={m.name}>
                          <td style={{ padding:"6px 6px", color:"#c8d8e8" }}>{m.name}</td>
                          <td style={{ padding:"6px 6px", color:"#ffd60a" }}>₹{m.price}</td>
                          <td style={{ padding:"6px 6px", color: m.change>=0?"#30d158":"#ff453a" }}>
                            {m.change>=0?"▲":"▼"}{Math.abs(m.change)}%
                          </td>
                          <td style={{ padding:"6px 6px", color:"#6b7a90" }}>{m.vol.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Price Volatility" sub="High-Low spread by crop" accent="#bf5af2" />
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={MARKET_DATA} barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="name" tick={{ fill:"#4a6a8a", fontSize:9 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:9 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="high" fill="#bf5af2" name="52W High" radius={[2,2,0,0]} />
                      <Bar dataKey="low" fill="#5e5ce6" name="52W Low" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="ML Crop Synthesis" sub="Random Forest recommendation engine" accent="#30d158" />
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                      {["N: 40","P: 30","K: 30","pH: 6.5"].map(t => (
                        <span key={t} style={{ background:"#00e5ff11", border:"1px solid #00e5ff33", color:"#00e5ff", fontSize:10, padding:"2px 8px", borderRadius:4 }}>{t}</span>
                      ))}
                    </div>
                    {[
                      { rank:1, crop:"Rice", score:94, profit:"₹48,200", yield:"4.2t/ha" },
                      { rank:2, crop:"Maize", score:87, profit:"₹31,600", yield:"5.8t/ha" },
                      { rank:3, crop:"Soybean", score:79, profit:"₹27,400", yield:"2.1t/ha" },
                    ].map(r => (
                      <div key={r.rank} style={{
                        background:"#0a1520", border:`1px solid ${r.rank===1?"#00e5ff33":"#1a2d45"}`,
                        borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", gap:12,
                      }}>
                        <div style={{ color: r.rank===1?"#ffd60a":"#4a6a8a", fontSize:16, fontWeight:700 }}>#{r.rank}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ color:"#c8d8e8", fontSize:12, fontWeight:600 }}>{r.crop}</div>
                          <div style={{ color:"#4a6a8a", fontSize:10 }}>Yield: {r.yield}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ color:"#30d158", fontSize:12 }}>{r.profit}</div>
                          <div style={{ color:"#5a7a9a", fontSize:10 }}>Match: {r.score}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DISEASE SCAN TAB ── */}
          {activeTab === "disease" && (
            <div className="slide-in">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:16 }}>
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:20 }}>
                  <SectionHeader title="Disease Diagnostics" sub="MobileNetV2 CNN — PlantVillage dataset (38 classes)" accent="#ff453a" />
                  <div style={{
                    border:"2px dashed #1e3a5f",
                    borderRadius:12, padding:40,
                    textAlign:"center",
                    background:"#080d14",
                    marginBottom:16,
                    cursor:"pointer",
                    transition:"border-color 0.2s",
                  }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>🌿</div>
                    <div style={{ color:"#4a6a8a", fontSize:12 }}>Drag & drop leaf image</div>
                    <div style={{ color:"#2a4a6a", fontSize:10, marginTop:4 }}>JPEG / PNG — Max 5MB</div>
                    <div style={{ marginTop:16, background:"#00e5ff", color:"#000", fontSize:11, fontWeight:700, padding:"8px 20px", borderRadius:6, display:"inline-block", cursor:"pointer" }}>
                      🔬 Launch Scanner Protocol
                    </div>
                  </div>

                  <div style={{ marginTop:12 }}>
                    <div style={{ color:"#4a6a8a", fontSize:10, letterSpacing:1, marginBottom:8 }}>RECENT DETECTIONS</div>
                    {[
                      { crop:"Tomato", disease:"Late Blight", conf:94.2, date:"2h ago", color:"#ff2d55" },
                      { crop:"Rice", disease:"Brown Spot", conf:87.6, date:"5h ago", color:"#ff9f0a" },
                      { crop:"Cotton", disease:"Leaf Curl Virus", conf:91.1, date:"1d ago", color:"#ff453a" },
                    ].map((d,i) => (
                      <div key={i} style={{ background:"#080d14", border:"1px solid #1a2d45", borderRadius:8, padding:"8px 12px", marginBottom:6, display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:3, height:36, background:d.color, borderRadius:2 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ color:"#c8d8e8", fontSize:11, fontWeight:600 }}>{d.crop} — {d.disease}</div>
                          <div style={{ color:"#4a6a8a", fontSize:9 }}>Confidence: <span style={{ color:d.color }}>{d.conf}%</span> · {d.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                    <SectionHeader title="Disease Incidence by Crop" sub="Last 30 days — all farms" accent="#ff9f0a" />
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={CROPS.slice(0,6).map(c => ({
                        crop:c,
                        blight: randInt(0,18),
                        mildew: randInt(0,12),
                        rust: randInt(0,8),
                        pest: randInt(0,15),
                      }))} barSize={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                        <XAxis dataKey="crop" tick={{ fill:"#4a6a8a", fontSize:9 }} />
                        <YAxis tick={{ fill:"#4a6a8a", fontSize:9 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize:9, color:"#6b7a90" }} />
                        <Bar dataKey="blight" fill="#ff453a" name="Blight" stackId="a" />
                        <Bar dataKey="mildew" fill="#ff9f0a" name="Mildew" stackId="a" />
                        <Bar dataKey="rust" fill="#ffd60a" name="Rust" stackId="a" />
                        <Bar dataKey="pest" fill="#bf5af2" name="Pest" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                    <SectionHeader title="Advisory Database" sub="Treatment protocols by disease class" accent="#00e5ff" />
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[
                        { d:"Leaf Blight", t:"Apply Mancozeb 75% WP @ 2g/L. Remove infected tissue.", severity:"High" },
                        { d:"Powdery Mildew", t:"Sulphur dust 3kg/acre or Hexaconazole @ 1ml/L.", severity:"Medium" },
                        { d:"Root Rot", t:"Soil drench with Metalaxyl. Improve drainage immediately.", severity:"Critical" },
                        { d:"Rust Fungus", t:"Propiconazole 25% EC @ 1ml/L. Repeat in 14 days.", severity:"High" },
                      ].map((row,i) => (
                        <div key={i} style={{ background:"#080d14", border:`1px solid ${SEV_COLORS[row.severity]}22`, borderRadius:8, padding:"8px 12px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ color:"#c8d8e8", fontSize:11, fontWeight:600 }}>🦠 {row.d}</span>
                            <Badge text={row.severity} color={SEV_COLORS[row.severity]} />
                          </div>
                          <div style={{ color:"#6b7a90", fontSize:10 }}>{row.t}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── IRRIGATION TAB ── */}
          {activeTab === "irrigation" && (
            <div className="slide-in">
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                <MetricCard icon="💧" label="Today Required" value="24.6" unit="mm" color="#0096ff" />
                <MetricCard icon="✅" label="Applied" value="22.1" unit="mm" change={-1.3} color="#30d158" />
                <MetricCard icon="⚡" label="Deficit" value="2.5" unit="mm" color="#ff9f0a" />
                <MetricCard icon="🌡" label="Evapotranspiration" value="4.2" unit="mm/day" color="#bf5af2" />
                <MetricCard icon="📊" label="Efficiency" value="89.8" unit="%" change={2.1} color="#00e5ff" />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16, marginBottom:16 }}>
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Irrigation Schedule — 14 Day Plan" sub="Required vs applied water (mm)" accent="#0096ff" />
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={irrigData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="day" tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:10 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize:10, color:"#6b7a90" }} />
                      <Bar dataKey="required" fill="#0096ff44" name="Required (mm)" radius={[2,2,0,0]} />
                      <Bar dataKey="applied" fill="#30d158" name="Applied (mm)" radius={[2,2,0,0]} barSize={8} />
                      <Line type="monotone" dataKey="deficit" stroke="#ff9f0a" strokeWidth={2} dot={{ r:3 }} name="Deficit (mm)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Smart Irrigation Engine" sub="ML-driven water management" accent="#0096ff" />
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {farms.map(f => (
                      <div key={f.id} style={{ background:"#080d14", borderRadius:8, padding:"8px 12px", border:"1px solid #1a2d45" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ color:"#c8d8e8", fontSize:11 }}>{f.name.split(" ").slice(0,2).join(" ")}</span>
                          <span style={{ color: f.moisture<40?"#ff453a":f.moisture<60?"#ff9f0a":"#30d158", fontSize:11 }}>
                            {f.moisture.toFixed(0)}% moisture
                          </span>
                        </div>
                        <div style={{ background:"#1a2535", borderRadius:3, height:5 }}>
                          <div style={{ width:`${f.moisture}%`, height:"100%", background: f.moisture<40?"#ff453a":f.moisture<60?"#ff9f0a":"#30d158", borderRadius:3 }} />
                        </div>
                        <div style={{ color:"#4a6a8a", fontSize:9, marginTop:3 }}>
                          Rec: {f.moisture<40?"Irrigate now":f.moisture<60?"Irrigate in 2 days":"Adequate — hold"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SOIL MATRIX TAB ── */}
          {activeTab === "soil" && (
            <div className="slide-in">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1fr", gap:16 }}>
                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Soil Radar Profile" sub="NPK + environmental analysis" accent="#30d158" />
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={soilData}>
                      <PolarGrid stroke="#1a2d45" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill:"#4a6a8a", fontSize:9 }} />
                      <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:"#2a4a6a", fontSize:8 }} />
                      <Radar name="Soil" dataKey="A" stroke="#30d158" fill="#30d15822" strokeWidth={2} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Nutrient Trends" sub="30-day soil health monitoring" accent="#ffd60a" />
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={Array.from({length:10},(_,i) => ({
                      day:`W${i+1}`,
                      nitrogen: randInt(30,80),
                      phosphorus: randInt(20,60),
                      potassium: randInt(40,90),
                      ph: +(rand(5.5,8.0)).toFixed(1),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                      <XAxis dataKey="day" tick={{ fill:"#4a6a8a", fontSize:9 }} />
                      <YAxis tick={{ fill:"#4a6a8a", fontSize:9 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize:9, color:"#6b7a90" }} />
                      <Line dataKey="nitrogen" stroke="#30d158" strokeWidth={2} dot={false} name="Nitrogen" />
                      <Line dataKey="phosphorus" stroke="#ff9f0a" strokeWidth={2} dot={false} name="Phosphorus" />
                      <Line dataKey="potassium" stroke="#0096ff" strokeWidth={2} dot={false} name="Potassium" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                  <SectionHeader title="Soil Parameters" sub="Current readings" accent="#bf5af2" />
                  {soilData.map((s,i) => (
                    <div key={i} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ color:"#6b7a90", fontSize:10 }}>{s.subject}</span>
                        <span style={{ color:"#c8d8e8", fontSize:10 }}>{s.A}/100</span>
                      </div>
                      <div style={{ background:"#1a2535", borderRadius:4, height:6 }}>
                        <div style={{
                          width:`${s.A}%`, height:"100%",
                          background: s.A>70?"#30d158":s.A>40?"#ff9f0a":"#ff453a",
                          borderRadius:4, transition:"width 1s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop:8, padding:10, background:"#080d14", borderRadius:8, border:"1px solid #1a2d45" }}>
                    <div style={{ color:"#4a6a8a", fontSize:9, letterSpacing:1, marginBottom:4 }}>RECOMMENDATION</div>
                    <div style={{ color:"#c8d8e8", fontSize:10 }}>Apply DAP fertilizer 50kg/acre. pH optimal for Rabi crops.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {activeTab === "alerts" && (
            <div className="slide-in">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <SectionHeader title="Active Alert Feed" sub="AI-generated warnings — all farms" accent="#ff453a" />
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {alerts.map(a => (
                      <div key={a.id} style={{
                        background:"#0c1620",
                        border:`1px solid ${SEV_COLORS[a.sev]}44`,
                        borderLeft:`4px solid ${SEV_COLORS[a.sev]}`,
                        borderRadius:10, padding:"12px 16px",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:16 }}>{a.icon}</span>
                            <span style={{ color:SEV_COLORS[a.sev], fontSize:12, fontWeight:700 }}>{a.type}</span>
                            <Badge text={a.sev} color={SEV_COLORS[a.sev]} />
                          </div>
                          <span style={{ color:"#2a4a6a", fontSize:10 }}>{a.time}</span>
                        </div>
                        <div style={{ color:"#c8d8e8", fontSize:12, marginBottom:4 }}>{a.msg}</div>
                        <div style={{ color:"#4a6a8a", fontSize:10 }}>📍 {a.farm}</div>
                        <div style={{ display:"flex", gap:6, marginTop:8 }}>
                          <button style={{ background:"#00e5ff22", border:"1px solid #00e5ff44", color:"#00e5ff", fontSize:10, padding:"3px 10px", borderRadius:4, cursor:"pointer" }}>Acknowledge</button>
                          <button style={{ background:"#ff453a22", border:"1px solid #ff453a44", color:"#ff453a", fontSize:10, padding:"3px 10px", borderRadius:4, cursor:"pointer" }}>Escalate</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16 }}>
                    <SectionHeader title="Alert Analytics" sub="Severity distribution" accent="#ff9f0a" />
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={SEVERITIES.map(s => ({ sev:s, count: randInt(1,8) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                        <XAxis dataKey="sev" tick={{ fill:"#4a6a8a", fontSize:10 }} />
                        <YAxis tick={{ fill:"#4a6a8a", fontSize:10 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="count" name="Count" radius={[4,4,0,0]}>
                          {SEVERITIES.map((s,i) => (
                            <rect key={i} fill={SEV_COLORS[s]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background:"#0c1620", border:"1px solid #1a2d45", borderRadius:12, padding:16, flex:1 }}>
                    <SectionHeader title="System Log" sub="Live telemetry stream" accent="#00e5ff" />
                    <div ref={logRef} style={{ height:220, overflow:"auto", fontFamily:"'JetBrains Mono', monospace", fontSize:10 }}>
                      {liveLog.map((l, i) => (
                        <div key={i} style={{
                          color: l.startsWith("[ SYS")?"#00e5ff":l.startsWith("[ ML")?"#bf5af2":l.startsWith("[ DB")?"#30d158":l.startsWith("[ API")?"#ffd60a":"#6b7a90",
                          padding:"2px 0",
                          borderBottom:"1px solid #0d1a25",
                        }}>{l}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
