"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ═══════════════════════════════════════════════════
// AITRIFY CLOUD MONITOR — Client Infrastructure Dashboard
// Naming: {Client}-{Product}-{Version}-{Year}-{Other}
// ═══════════════════════════════════════════════════

type InfraStatus = "running" | "warning" | "error" | "stopped";

interface ServiceCost {
  name: string;
  cost: number;
  forecast: number;
  color: string;
  icon: string;
}

interface DailyCost {
  date: string;
  cost: number;
  storage: number;
}

interface MonthlyCost {
  month: string;
  cost: number;
}

interface StorageBucket {
  name: string;
  sizeGB: number;
  files: number | null;
  location: string;
  class: string;
  public: boolean;
  color: string;
}

interface InfraItem {
  name: string;
  status: InfraStatus;
  detail: string;
  revision?: string;
  region?: string;
}

interface MigrationTable {
  table: string;
  total: number;
  migrated: number;
  remaining: number;
}

interface ClientData {
  id: string;
  name: string;
  product: string;
  version: string;
  year: number;
  gcpProject: string;
  region: string;
  status: string;
  deployDate: string;
  costs: {
    current: {
      total: number;
      forecast: number;
      services: ServiceCost[];
    };
    daily: DailyCost[];
    monthly: MonthlyCost[];
  };
  storage: {
    totalGB: number;
    totalFiles: number;
    buckets: StorageBucket[];
  };
  infra: InfraItem[];
  migration: {
    source: string;
    target: string;
    totalFiles: number;
    totalGB: number;
    completed: string;
    tables: MigrationTable[];
  };
}

const CLIENTS: Record<string, ClientData> = {
  "zemmer-qlbh-v1.0-2026": {
    id: "zemmer-qlbh-v1.0-2026",
    name: "Zemmer",
    product: "QLBH (Quản lý Bảo hành)",
    version: "v1.0",
    year: 2026,
    gcpProject: "zemmer-qlbh-gcr",
    region: "asia-southeast1",
    status: "active",
    deployDate: "2026-03-31",
    // ══ COST DATA (VNĐ) ══
    costs: {
      current: {
        total: 220923,
        forecast: 355927,
        services: [
          { name: "Cloud SQL", cost: 192533, forecast: 378156, color: "#ef4444", icon: "🗄️" },
          { name: "Cloud Storage", cost: 44037, forecast: 72000, color: "#22c55e", icon: "📦" },
          { name: "Cloud Run", cost: 8200, forecast: 15000, color: "#3b82f6", icon: "⚡" },
          { name: "Cloud Build", cost: 3800, forecast: 6500, color: "#f59e0b", icon: "🔨" },
          { name: "Networking", cost: 2100, forecast: 4200, color: "#8b5cf6", icon: "🌐" },
          { name: "Other", cost: 1253, forecast: 2100, color: "#6b7280", icon: "📊" },
        ],
      },
      daily: [
        { date: "Apr 01", cost: 5200, storage: 0.8 },
        { date: "Apr 02", cost: 5400, storage: 0.8 },
        { date: "Apr 03", cost: 5100, storage: 0.9 },
        { date: "Apr 04", cost: 5300, storage: 0.9 },
        { date: "Apr 05", cost: 5600, storage: 1.0 },
        { date: "Apr 06", cost: 5500, storage: 1.0 },
        { date: "Apr 07", cost: 5200, storage: 1.1 },
        { date: "Apr 08", cost: 5800, storage: 1.1 },
        { date: "Apr 09", cost: 6100, storage: 1.2 },
        { date: "Apr 10", cost: 5900, storage: 1.2 },
        { date: "Apr 11", cost: 6200, storage: 1.3 },
        { date: "Apr 12", cost: 6400, storage: 1.3 },
        { date: "Apr 13", cost: 6100, storage: 1.4 },
        { date: "Apr 14", cost: 8500, storage: 45.0 },
        { date: "Apr 15", cost: 12800, storage: 95.0 },
        { date: "Apr 16", cost: 14200, storage: 125.1 },
        { date: "Apr 17", cost: 7800, storage: 125.1 },
      ],
      monthly: [
        { month: "Jan", cost: 145000 },
        { month: "Feb", cost: 152000 },
        { month: "Mar", cost: 168000 },
        { month: "Apr*", cost: 355927 },
      ],
    },
    // ══ STORAGE DATA ══
    storage: {
      totalGB: 125.07,
      totalFiles: 90390,
      buckets: [
        { name: "zemmer-media-storage", sizeGB: 125.07, files: 90390, location: "asia-southeast1", class: "Standard", public: true, color: "#22c55e" },
        { name: "zemmer-qlbh-gcr_cloudbuild", sizeGB: 11.68, files: null, location: "us (multi)", class: "Multi-region", public: false, color: "#f59e0b" },
        { name: "zemmer-qlbh-backup", sizeGB: 0.2, files: null, location: "asia-southeast1", class: "Standard", public: false, color: "#8b5cf6" },
        { name: "zemmer-db-backups", sizeGB: 0.02, files: null, location: "asia-southeast1", class: "Standard", public: false, color: "#6b7280" },
      ],
    },
    // ══ INFRA STATUS ══
    infra: [
      { name: "Cloud Run (BE)", status: "running", detail: "zemmer-be :1.18", revision: "zemmer-be-00033-ppr" },
      { name: "Cloud SQL", status: "running", detail: "MySQL 8.0 — zemmer-db", region: "asia-southeast1-c" },
      { name: "Firebase Hosting", status: "running", detail: "zemmer-qlbh-gcr.web.app" },
      { name: "Upstash Redis", status: "running", detail: "Singapore — Free tier" },
    ],
    // ══ MIGRATION STATUS ══
    migration: {
      source: "ClickUp",
      target: "GCS",
      totalFiles: 90390,
      totalGB: 125.07,
      completed: "2026-04-16",
      tables: [
        { table: "tblhinh.hinh_anh", total: 89956, migrated: 89912, remaining: 44 },
        { table: "tblrequest.anh_tiep_nhan", total: 7596, migrated: 7587, remaining: 497 },
      ],
    },
  },
  "aitrify-platform-v1.0-2026": {
    id: "aitrify-platform-v1.0-2026",
    name: "AItrify Platform",
    product: "Multi-Agent AI Platform",
    version: "v1.0",
    year: 2026,
    gcpProject: "aitrify-main",
    region: "asia-southeast1",
    status: "active",
    deployDate: "2026-01-15",
    costs: {
      current: {
        total: 83500,
        forecast: 142000,
        services: [
          { name: "Cloud Run", cost: 35200, forecast: 62000, color: "#3b82f6", icon: "⚡" },
          { name: "CF Workers", cost: 18400, forecast: 30000, color: "#f97316", icon: "☁️" },
          { name: "R2 Storage", cost: 12600, forecast: 21000, color: "#22c55e", icon: "📦" },
          { name: "Vectorize", cost: 8900, forecast: 15000, color: "#8b5cf6", icon: "🔮" },
          { name: "Networking", cost: 4900, forecast: 8500, color: "#06b6d4", icon: "🌐" },
          { name: "Other", cost: 3500, forecast: 5500, color: "#6b7280", icon: "📊" },
        ],
      },
      daily: [
        { date: "Apr 01", cost: 2100, storage: 6.2 },
        { date: "Apr 02", cost: 2300, storage: 6.3 },
        { date: "Apr 03", cost: 2200, storage: 6.3 },
        { date: "Apr 04", cost: 2400, storage: 6.4 },
        { date: "Apr 05", cost: 2600, storage: 6.5 },
        { date: "Apr 06", cost: 2500, storage: 6.5 },
        { date: "Apr 07", cost: 2300, storage: 6.6 },
        { date: "Apr 08", cost: 2700, storage: 6.7 },
        { date: "Apr 09", cost: 2800, storage: 6.8 },
        { date: "Apr 10", cost: 2600, storage: 6.9 },
        { date: "Apr 11", cost: 3100, storage: 7.1 },
        { date: "Apr 12", cost: 3300, storage: 7.2 },
        { date: "Apr 13", cost: 3200, storage: 7.3 },
        { date: "Apr 14", cost: 3500, storage: 7.5 },
        { date: "Apr 15", cost: 4200, storage: 7.8 },
        { date: "Apr 16", cost: 4800, storage: 8.1 },
        { date: "Apr 17", cost: 3900, storage: 8.2 },
      ],
      monthly: [
        { month: "Jan", cost: 52000 },
        { month: "Feb", cost: 61000 },
        { month: "Mar", cost: 74000 },
        { month: "Apr*", cost: 142000 },
      ],
    },
    storage: {
      totalGB: 8.2,
      totalFiles: 12450,
      buckets: [
        { name: "aitrify-r2-agent-data", sizeGB: 5.8, files: 9870, location: "Cloudflare R2", class: "Standard", public: false, color: "#f97316" },
        { name: "aitrify-r2-public-assets", sizeGB: 1.6, files: 2580, location: "Cloudflare R2", class: "Standard", public: true, color: "#22c55e" },
        { name: "aitrify-gcs-logs", sizeGB: 0.6, files: null, location: "asia-southeast1", class: "Standard", public: false, color: "#6b7280" },
        { name: "aitrify-gcs-backups", sizeGB: 0.2, files: null, location: "asia-southeast1", class: "Standard", public: false, color: "#8b5cf6" },
      ],
    },
    infra: [
      { name: "Cloud Run (aitrify-api)", status: "running", detail: "aitrify-api :1.0", revision: "aitrify-api-00012-xkr" },
      { name: "Cloud Run (baisys-api)", status: "running", detail: "baisys-api :1.0", revision: "baisys-api-00008-zpt" },
      { name: "Cloud Run (naga-trainer-api)", status: "running", detail: "naga-trainer-api :1.0", revision: "naga-trainer-00005-qmv" },
      { name: "CF Workers (auth-api)", status: "running", detail: "aitrify-auth-api — hoangn-ahg.workers.dev" },
      { name: "CF Vectorize (4 indexes)", status: "running", detail: "ANNA · LISA · UGREEN · NAGA" },
    ],
    migration: {
      source: "Dev",
      target: "CF Vectorize",
      totalFiles: 12450,
      totalGB: 5.8,
      completed: "2026-01-15",
      tables: [
        { table: "vectorize.aitrify_bee_anna", total: 4200, migrated: 4200, remaining: 0 },
        { table: "vectorize.aitrify_bee_lisa", total: 3850, migrated: 3850, remaining: 0 },
        { table: "vectorize.aitrify_bee_ugreen", total: 2800, migrated: 2800, remaining: 0 },
        { table: "vectorize.aitrify_naga_nag01", total: 1600, migrated: 1600, remaining: 0 },
      ],
    },
  },
};

// ══ UTILITY ══
const formatVND = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M đ`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K đ`;
  return `${n.toLocaleString()} đ`;
};
const formatGB = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)} TB` : n >= 1 ? `${n.toFixed(1)} GB` : `${(n * 1024).toFixed(0)} MB`;
const pctChange = (curr: number, prev: number): string | null => {
  if (!prev) return null;
  return (((curr - prev) / prev) * 100).toFixed(1);
};

// ══ COMPONENTS ══

interface StatusDotProps {
  status: InfraStatus;
}
const StatusDot = ({ status }: StatusDotProps) => {
  const colors: Record<InfraStatus, string> = { running: "#22c55e", warning: "#f59e0b", error: "#ef4444", stopped: "#6b7280" };
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      backgroundColor: colors[status] || "#6b7280",
      boxShadow: `0 0 6px ${colors[status] || "#6b7280"}`,
      marginRight: 8
    }} />
  );
};

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  trend?: string | null;
  trendLabel?: string;
  accent?: string;
}
const MetricCard = ({ icon, label, value, sub, trend, trendLabel, accent = "#22c55e" }: MetricCardProps) => (
  <div style={{
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: "24px 20px",
    display: "flex", flexDirection: "column", gap: 8,
    backdropFilter: "blur(20px)",
    transition: "all 0.3s ease",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "'JetBrains Mono', 'SF Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{sub}</div>}
    {trend !== null && trend !== undefined && (
      <div style={{
        display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600,
        color: parseFloat(trend) > 0 ? "#f59e0b" : "#22c55e",
      }}>
        <span>{parseFloat(trend) > 0 ? "▲" : "▼"} {Math.abs(parseFloat(trend))}%</span>
        {trendLabel && <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>{trendLabel}</span>}
      </div>
    )}
  </div>
);

interface TooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (value: number) => string;
}
const CustomTooltip = ({ active, payload, label, formatter }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,15,20,0.95)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "12px 16px", backdropFilter: "blur(20px)",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, color: p.color || "#fff", fontWeight: 600 }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

// ══ MAIN DASHBOARD ══
export default function CloudMonitorDashboard() {
  const [selectedClient, setSelectedClient] = useState<string>("zemmer-qlbh-v1.0-2026");
  const [timeRange, setTimeRange] = useState<"week" | "month">("month");
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const client = CLIENTS[selectedClient];
  const costs = client.costs;
  const storage = client.storage;

  const todayCost = costs.daily[costs.daily.length - 1]?.cost || 0;
  const yesterdayCost = costs.daily[costs.daily.length - 2]?.cost || 0;
  const weekCost = costs.daily.slice(-7).reduce((s, d) => s + d.cost, 0);
  const prevWeekCost = costs.daily.slice(-14, -7).reduce((s, d) => s + d.cost, 0);
  const forecastMonth = costs.current.forecast;

  const storageGrowth = (costs.daily[costs.daily.length - 1]?.storage ?? 0) - (costs.daily[0]?.storage ?? 0);

  const totalBucketSize = storage.buckets.reduce((s, b) => s + b.sizeGB, 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#fff",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      opacity: loaded ? 1 : 0,
      transform: loaded ? "none" : "translateY(8px)",
      transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
    }}>
      {/* ═══ AMBIENT BG ═══ */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,197,94,0.08), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59,130,246,0.05), transparent)",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {/* ═══ HEADER ═══ */}
        <header style={{
          padding: "32px 0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #22c55e, #15803d)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "#fff",
              }}>A</div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                  Aitrify <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>Cloud Monitor</span>
                </h1>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Infrastructure & Cost Monitoring Dashboard
            </p>
          </div>

          {/* Client Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", outline: "none", minWidth: 260,
              }}
            >
              {Object.entries(CLIENTS).map(([id, c]) => (
                <option key={id} value={id} style={{ background: "#1a1a2e" }}>
                  {c.name} — {c.product} {c.version} ({c.year})
                </option>
              ))}
            </select>
            <div style={{
              display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {(["week", "month"] as const).map((r) => (
                <button key={r} onClick={() => setTimeRange(r)} style={{
                  padding: "8px 16px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  background: timeRange === r ? "rgba(34,197,94,0.2)" : "transparent",
                  color: timeRange === r ? "#22c55e" : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                }}>{r}</button>
              ))}
            </div>
          </div>
        </header>

        {/* ═══ CLIENT INFO BAR ═══ */}
        <div style={{
          display: "flex", alignItems: "center", gap: 24, padding: "16px 0",
          borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap",
          fontSize: 13, color: "rgba(255,255,255,0.5)",
        }}>
          <span><StatusDot status="running" /> <strong style={{ color: "#fff" }}>{client.name}</strong></span>
          <span>📍 {client.region}</span>
          <span>🏗️ {client.gcpProject}</span>
          <span>📅 Deploy: {client.deployDate}</span>
          <span style={{ marginLeft: "auto", fontSize: 11, padding: "4px 12px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#22c55e", fontWeight: 600 }}>
            PRODUCTION
          </span>
        </div>

        {/* ═══ METRIC CARDS ═══ */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16, padding: "24px 0",
        }}>
          <MetricCard
            icon="💰" label="Tổng chi phí tháng" value={formatVND(costs.current.total)}
            sub={`Forecast: ${formatVND(forecastMonth)}`}
            trend={pctChange(forecastMonth, 168000)} trendLabel="vs tháng trước"
            accent="#ef4444"
          />
          <MetricCard
            icon="📊" label="Chi phí hôm nay" value={formatVND(todayCost)}
            trend={pctChange(todayCost, yesterdayCost)} trendLabel="vs hôm qua"
            accent="#f59e0b"
          />
          <MetricCard
            icon="💾" label="Tổng dung lượng" value={formatGB(storage.totalGB)}
            sub={`${storage.totalFiles.toLocaleString()} files`}
            trend={((storageGrowth / (costs.daily[0]?.storage ?? 1)) * 100).toFixed(0)} trendLabel="tăng trong tháng"
            accent="#22c55e"
          />
          <MetricCard
            icon="📦" label="Tuần này" value={formatVND(weekCost)}
            trend={pctChange(weekCost, prevWeekCost)} trendLabel="vs tuần trước"
            accent="#3b82f6"
          />
        </div>

        {/* ═══ CHARTS ROW 1: Cost Trend + Service Breakdown ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, paddingBottom: 16 }}>
          {/* Cost Trend */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "rgba(255,255,255,0.7)" }}>Chi phí theo ngày (VNĐ)</h3>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>April 2026</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeRange === "week" ? costs.daily.slice(-7) : costs.daily}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip formatter={formatVND} />} />
                <Area type="monotone" dataKey="cost" stroke="#22c55e" strokeWidth={2} fill="url(#costGrad)" name="Chi phí" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Service Breakdown */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: "rgba(255,255,255,0.7)" }}>Phân bổ chi phí</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={costs.current.services}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={65}
                  paddingAngle={2} dataKey="cost"
                  stroke="none"
                >
                  {costs.current.services.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip formatter={formatVND} />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {costs.current.services.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{s.icon} {s.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#fff" }}>{formatVND(s.cost)}</span>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace", fontSize: 11 }}>
                      {((s.cost / costs.current.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ CHARTS ROW 2: Storage Growth + Bucket Breakdown ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, paddingBottom: 16 }}>
          {/* Storage Growth */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "rgba(255,255,255,0.7)" }}>Dung lượng tăng trưởng (GB)</h3>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                📈 Migration spike Apr 14-16
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeRange === "week" ? costs.daily.slice(-7) : costs.daily}>
                <defs>
                  <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(1)} GB`} />} />
                <Area type="monotone" dataKey="storage" stroke="#3b82f6" strokeWidth={2} fill="url(#storageGrad)" name="Storage" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bucket Breakdown */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 20px", color: "rgba(255,255,255,0.7)" }}>Buckets</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {storage.buckets.map((b, i) => {
                const pct = (b.sizeGB / totalBucketSize) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{b.name}</span>
                      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "#fff" }}>{formatGB(b.sizeGB)}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${Math.max(pct, 1)}%`,
                        background: `linear-gradient(90deg, ${b.color}, ${b.color}88)`,
                        borderRadius: 3, transition: "width 0.8s ease",
                      }} />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      <span>📍 {b.location}</span>
                      <span>{b.class}</span>
                      {b.public && <span style={{ color: "#f59e0b" }}>🔓 Public</span>}
                      {b.files && <span>{b.files.toLocaleString()} files</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ INFRA STATUS + MIGRATION ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingBottom: 16 }}>
          {/* Infra */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: "rgba(255,255,255,0.7)" }}>🏗️ Infrastructure Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {client.infra.map((s, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusDot status={s.status} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.detail}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: "3px 10px", borderRadius: 12,
                    background: "rgba(34,197,94,0.1)", color: "#22c55e",
                    fontWeight: 600, textTransform: "uppercase",
                  }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Migration */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", color: "rgba(255,255,255,0.7)" }}>📦 Migration Status — {client.migration.source} → {client.migration.target}</h3>
            <div style={{
              display: "flex", gap: 16, marginBottom: 20,
              padding: "16px", borderRadius: 12, background: "rgba(34,197,94,0.05)",
              border: "1px solid rgba(34,197,94,0.1)",
            }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e", fontFamily: "monospace" }}>{client.migration.totalFiles.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>files migrated</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6", fontFamily: "monospace" }}>{formatGB(client.migration.totalGB)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>total size</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace" }}>{client.migration.completed}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>completed</div>
              </div>
            </div>
            {client.migration.tables.map((t, i) => {
              const pct = (t.migrated / t.total) * 100;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{t.table}</span>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{t.migrated.toLocaleString()} / {t.total.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: pct > 99 ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #f59e0b, #d97706)",
                      borderRadius: 4, transition: "width 1s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                    {pct.toFixed(1)}% complete — {t.remaining.toLocaleString()} remaining
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ MONTHLY TREND ═══ */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 20px", color: "rgba(255,255,255,0.7)" }}>Xu hướng chi phí theo tháng</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={costs.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip formatter={formatVND} />} />
              <Bar dataKey="cost" name="Chi phí" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {costs.monthly.map((m, i) => (
                  <Cell key={i} fill={m.month.includes("*") ? "rgba(245,158,11,0.6)" : "rgba(34,197,94,0.5)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
            * Tháng 4 là forecast — bao gồm chi phí migration spike
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer style={{
          padding: "24px 0", borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 24,
        }}>
          <span>Aitrify Cloud Monitor — Built for {client.name} infrastructure</span>
          <span>Last updated: Apr 17, 2026 09:00 UTC+7</span>
        </footer>
      </div>
    </div>
  );
}
