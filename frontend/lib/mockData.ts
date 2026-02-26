export const rand = (min: number, max: number) => Math.random() * (max - min) + min;
export const randInt = (min: number, max: number) => Math.floor(rand(min, max));

export const CROPS = ["Rice", "Wheat", "Cotton", "Sugarcane", "Soybean", "Maize", "Groundnut", "Turmeric"];
export const DISEASES = ["Leaf Blight", "Powdery Mildew", "Root Rot", "Rust Fungus", "Aphid Infestation"];
export const SEVERITIES = ["Critical", "High", "Medium", "Low"];
export const SEV_COLORS: Record<string, string> = { Critical: "#ff2d55", High: "#ff9f0a", Medium: "#ffd60a", Low: "#30d158" };

export const genWeather = () => ({
    temp: +(rand(22, 38)).toFixed(1),
    humidity: +(rand(45, 85)).toFixed(1),
    rainfall: +(rand(0, 12)).toFixed(2),
    wind: +(rand(4, 28)).toFixed(1),
    uv: randInt(3, 11),
    soilMoisture: +(rand(18, 72)).toFixed(1),
    pressure: +(rand(1008, 1022)).toFixed(0),
});

export const genFarms = () => [
    { id: 1, name: "North Field Alpha", crop: "Rice", acres: 42, lat: 17.38, lng: 78.47, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Flowering", alert: Math.random() > 0.5 },
    { id: 2, name: "South Block Beta", crop: "Cotton", acres: 67, lat: 17.12, lng: 78.21, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Boll Formation", alert: Math.random() > 0.6 },
    { id: 3, name: "East Parcel Gamma", crop: "Wheat", acres: 31, lat: 17.55, lng: 78.62, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Tillering", alert: Math.random() > 0.7 },
    { id: 4, name: "West Zone Delta", crop: "Sugarcane", acres: 88, lat: 17.29, lng: 78.05, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Grand Growth", alert: Math.random() > 0.4 },
    { id: 5, name: "Central Hub Epsilon", crop: "Soybean", acres: 55, lat: 17.44, lng: 78.35, risk: rand(0.1, 0.95), moisture: rand(20, 80), ndvi: rand(0.3, 0.9), health: randInt(55, 99), stage: "Pod Fill", alert: Math.random() > 0.65 },
];

export const genRiskTrend = () => Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    rice: +(rand(0.1, 0.9)).toFixed(2),
    cotton: +(rand(0.1, 0.9)).toFixed(2),
    wheat: +(rand(0.1, 0.9)).toFixed(2),
    avg: +(rand(0.15, 0.75)).toFixed(2),
}));

export const genNDVIHistory = () => Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    ndvi: +(rand(0.35, 0.85)).toFixed(3),
    evi: +(rand(0.25, 0.70)).toFixed(3),
    threshold: 0.4,
}));

export const genYieldHistory = () => ["2019", "2020", "2021", "2022", "2023", "2024"].map(year => ({
    year,
    rice: randInt(2800, 4200),
    cotton: randInt(1500, 2800),
    wheat: randInt(3100, 4600),
    soybean: randInt(1800, 2900),
}));

export const genAlerts = () => [
    { id: 1, type: "Disease", farm: "North Field Alpha", msg: "Leaf Blight detected in Zone 3", sev: "Critical", time: "2m ago", icon: "🦠" },
    { id: 2, type: "Weather", farm: "South Block Beta", msg: "Cyclonic winds forecast — 72hr window", sev: "High", time: "14m ago", icon: "🌪" },
    { id: 3, type: "Irrigation", farm: "West Zone Delta", msg: "Soil moisture critically low — irrigate", sev: "High", time: "31m ago", icon: "💧" },
    { id: 4, type: "Market", farm: "All Farms", msg: "Cotton price surge +12% — sell window open", sev: "Low", time: "1h ago", icon: "📈" },
    { id: 5, type: "Pest", farm: "East Parcel Gamma", msg: "Aphid colony expansion detected", sev: "Medium", time: "2h ago", icon: "🐛" },
    { id: 6, type: "Yield", farm: "Central Hub Epsilon", msg: "Yield projection revised down 8%", sev: "Medium", time: "3h ago", icon: "⚠️" },
];
