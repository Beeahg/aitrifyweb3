"use client";

import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Holding {
  ma: string;
  sl: number;
  giaTB: number;
  giaHienTai: number;
  plPercent: number;
  tang: "Core" | "SongNganh" | "HighBeta" | "ChooCatalyst";
  catalyst: string;
  tk: "X1" | "M1";
  broker: "TPBS" | "VBSE";
}

interface AccountData {
  vonGoc: number;
  thiGia: number;
  tienMat: number;
  duNoMargin?: number;
  safetyRatio?: number;
  m1Usage?: number;
  holdings: Holding[];
}

interface TransactionData {
  grossProfit: number;
  feeTax: number;
  marginCostEst: number;
  netProfit: number;
}

interface ASAData {
  date: string;
  accounts: { X1: AccountData; M1: AccountData };
  transactions_yesterday: TransactionData;
  uploadedAt: string;
}

interface Signal {
  type: "BUY" | "SELL" | "WATCH" | "HOLD";
  priority: number;
  ma: string;
  sl: number;
  giaDat: string;
  giaTB?: number;
  tk: "X1" | "M1";
  broker: "TPBS" | "VBSE";
  lyDo: string;
  catalyst?: string;
}

// ─── Mock data (dùng khi chưa có file upload) ─────────────────────────────────

const MOCK_DATA: ASAData = {
  date: new Date().toISOString().slice(0, 10),
  uploadedAt: new Date().toISOString(),
  accounts: {
    X1: {
      vonGoc: 261000000,
      thiGia: 256000000,
      tienMat: 12000000,
      holdings: [
        { ma: "DGC", sl: 1500, giaTB: 56879, giaHienTai: 55200, plPercent: -2.95, tang: "Core", catalyst: "ĐHCĐ 8/5", tk: "X1", broker: "TPBS" },
        { ma: "VIC", sl: 100, giaTB: 195343, giaHienTai: 192000, plPercent: -1.71, tang: "Core", catalyst: "Core dài hạn", tk: "X1", broker: "TPBS" },
        { ma: "FPT", sl: 100, giaTB: 76615, giaHienTai: 78200, plPercent: 2.07, tang: "Core", catalyst: "FTSE T9/2026", tk: "X1", broker: "TPBS" },
        { ma: "NAG", sl: 4800, giaTB: 8320, giaHienTai: 8100, plPercent: -2.64, tang: "HighBeta", catalyst: "QM 13/5", tk: "X1", broker: "TPBS" },
        { ma: "HQC", sl: 2300, giaTB: 2610, giaHienTai: 2650, plPercent: 1.53, tang: "HighBeta", catalyst: "High-beta HNX", tk: "X1", broker: "TPBS" },
        { ma: "VIX", sl: 300, giaTB: 16675, giaHienTai: 16400, plPercent: -1.65, tang: "HighBeta", catalyst: "Không catalyst", tk: "X1", broker: "TPBS" },
        { ma: "VOS", sl: 200, giaTB: 13170, giaHienTai: 12900, plPercent: -2.05, tang: "HighBeta", catalyst: "Không catalyst", tk: "X1", broker: "TPBS" },
        { ma: "GAS", sl: 100, giaTB: 88232, giaHienTai: 89500, plPercent: 1.44, tang: "ChooCatalyst", catalyst: "Dầu khí", tk: "X1", broker: "TPBS" },
      ],
    },
    M1: {
      vonGoc: 501000000,
      thiGia: 487000000,
      tienMat: 33000000,
      duNoMargin: 210000000,
      safetyRatio: 0.38,
      m1Usage: 0.62,
      holdings: [
        { ma: "VHM", sl: 300, giaTB: 146225, giaHienTai: 149000, plPercent: 1.90, tang: "Core", catalyst: "Core M1", tk: "M1", broker: "TPBS" },
        { ma: "TCB", sl: 400, giaTB: 32786, giaHienTai: 33100, plPercent: 0.96, tang: "SongNganh", catalyst: "Ngân hàng FTSE", tk: "M1", broker: "TPBS" },
        { ma: "SSI", sl: 1100, giaTB: 28328, giaHienTai: 27800, plPercent: -1.87, tang: "SongNganh", catalyst: "CK FTSE", tk: "M1", broker: "TPBS" },
        { ma: "VIC", sl: 700, giaTB: 216033, giaHienTai: 212000, plPercent: -1.87, tang: "Core", catalyst: "Core dài hạn", tk: "M1", broker: "TPBS" },
      ],
    },
  },
  transactions_yesterday: {
    grossProfit: 6200000,
    feeTax: 470665,
    marginCostEst: 246575,
    netProfit: 5482760,
  },
};

// ─── Tính signals từ data ─────────────────────────────────────────────────────

function computeSignals(data: ASAData): Signal[] {
  const signals: Signal[] = [];
  const allHoldings = [
    ...data.accounts.X1.holdings,
    ...data.accounts.M1.holdings,
  ];
  const safetyRatio = data.accounts.M1.safetyRatio ?? 0.5;
  const m1Usage = data.accounts.M1.m1Usage ?? 0.4;

  // Rule: M1 usage > 60% → bán dead money
  if (m1Usage > 0.6) {
    const deadMoney = allHoldings.filter(
      (h) => h.catalyst === "Không catalyst" && h.plPercent < 0
    );
    deadMoney.forEach((h, i) => {
      signals.push({
        type: "SELL",
        priority: i + 1,
        ma: h.ma,
        sl: h.sl,
        giaDat: Math.round(h.giaHienTai * 1.015).toLocaleString("vi-VN") + "+",
        giaTB: h.giaTB,
        tk: h.tk,
        broker: h.broker,
        lyDo: "Dead money · M1 usage " + Math.round(m1Usage * 100) + "% > 60%",
      });
    });
  }

  // Rule: Safety ratio < 40% → ưu tiên giảm margin
  if (safetyRatio < 0.4) {
    const marginalHoldings = data.accounts.M1.holdings
      .filter((h) => h.plPercent < -1 && h.tang !== "Core")
      .slice(0, 1);
    marginalHoldings.forEach((h) => {
      signals.push({
        type: "SELL",
        priority: 0,
        ma: h.ma,
        sl: Math.round(h.sl * 0.3),
        giaDat: Math.round(h.giaHienTai * 0.995).toLocaleString("vi-VN"),
        giaTB: h.giaTB,
        tk: h.tk,
        broker: h.broker,
        lyDo: "Safety Ratio " + Math.round(safetyRatio * 100) + "% < 40% · giảm margin khẩn",
      });
    });
  }

  // Rule: NAG deadline
  const nag = allHoldings.find((h) => h.ma === "NAG");
  if (nag) {
    signals.push({
      type: "WATCH",
      priority: 5,
      ma: "NAG",
      sl: nag.sl,
      giaDat: "10,000 (QM)",
      giaTB: nag.giaTB,
      tk: nag.tk,
      broker: nag.broker,
      lyDo: "Quyền mua 13/5 giá 10,000 — thị trường " + nag.giaHienTai.toLocaleString("vi-VN"),
      catalyst: "QM 13/5",
    });
  }

  // Rule: VPB mua vào nếu có tiền sau bán
  signals.push({
    type: "BUY",
    priority: 10,
    ma: "VPB",
    sl: 500,
    giaDat: "21,500–22,000",
    tk: "X1",
    broker: "VBSE",
    lyDo: "CAEX catalyst · dòng tiền ngoại · dùng vốn từ bán VIX/VOS",
    catalyst: "CAEX",
  });

  // Rule: DGC HOLD
  const dgc = allHoldings.find((h) => h.ma === "DGC");
  if (dgc) {
    signals.push({
      type: "HOLD",
      priority: 99,
      ma: "DGC",
      sl: dgc.sl,
      giaDat: "—",
      giaTB: dgc.giaTB,
      tk: dgc.tk,
      broker: dgc.broker,
      lyDo: "Chờ ĐHCĐ bất thường 8/5 · pháo đài tiền mặt 11,255 tỷ",
      catalyst: "ĐHCĐ 8/5",
    });
  }

  return signals.sort((a, b) => a.priority - b.priority);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
const fmtTr = (n: number) => (n / 1e9).toFixed(3) + " tỷ";

function safRatio(data: ASAData) {
  return Math.round((data.accounts.M1.safetyRatio ?? 0.5) * 100);
}
function m1UsagePct(data: ASAData) {
  return Math.round((data.accounts.M1.m1Usage ?? 0.4) * 100);
}
function totalNav(data: ASAData) {
  return data.accounts.X1.thiGia + data.accounts.M1.thiGia;
}

// ─── Signal Card ──────────────────────────────────────────────────────────────

const SIGNAL_STYLE = {
  BUY:   { border: "border-l-green-500",  bg: "bg-green-950/40",  badge: "bg-green-900/60 text-green-300",  label: "MUA VÀO" },
  SELL:  { border: "border-l-red-500",    bg: "bg-red-950/40",    badge: "bg-red-900/60 text-red-300",      label: "BÁN NGAY" },
  WATCH: { border: "border-l-amber-500",  bg: "bg-amber-950/30",  badge: "bg-amber-900/60 text-amber-300",  label: "QUYẾT ĐỊNH" },
  HOLD:  { border: "border-l-gray-500",   bg: "bg-gray-800/30",   badge: "bg-gray-700/60 text-gray-300",    label: "GIỮ NGUYÊN" },
};

function SignalCard({ sig, idx }: { sig: Signal; idx: number }) {
  const s = SIGNAL_STYLE[sig.type];
  return (
    <div className={`border-l-2 ${s.border} ${s.bg} rounded-r-lg px-4 py-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${s.badge}`}>
            {s.label}
          </span>
          <span className="font-mono text-base font-semibold text-white">{sig.ma}</span>
          <span className="text-[10px] font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
            {sig.tk} · {sig.broker}
          </span>
          {sig.catalyst && (
            <span className="text-[10px] font-mono bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded">
              {sig.catalyst}
            </span>
          )}
        </div>
        {sig.type === "SELL" && (
          <span className="text-[10px] font-mono text-red-400">Ưu tiên {idx + 1}</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <p className="text-[10px] font-mono text-gray-500 mb-0.5">Số lượng</p>
          <p className="font-mono text-sm font-medium text-white">{sig.sl.toLocaleString()} cp</p>
        </div>
        {sig.giaTB && (
          <div>
            <p className="text-[10px] font-mono text-gray-500 mb-0.5">Giá TB vào</p>
            <p className="font-mono text-sm font-medium text-white">{sig.giaTB.toLocaleString("vi-VN")}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-mono text-gray-500 mb-0.5">Giá đặt</p>
          <p className={`font-mono text-sm font-medium ${sig.type === "BUY" ? "text-green-400" : sig.type === "SELL" ? "text-red-400" : "text-gray-300"}`}>
            {sig.giaDat}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-gray-500 mb-0.5">Lý do</p>
          <p className="font-mono text-[11px] text-gray-400 leading-tight">{sig.lyDo}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Ratio Bar ────────────────────────────────────────────────────────────────

function RatioBar({ label, maCodes, current, target, color }: {
  label: string; maCodes: string; current: number; target: number; color: string;
}) {
  const over = current > target;
  const pct = Math.min(current / target, 1.2) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="font-mono text-xs font-medium text-gray-200">{label}</span>
          <span className="font-mono text-[10px] text-gray-600 ml-2">{maCodes}</span>
        </div>
        <div className="flex gap-3">
          <span className={`font-mono text-[10px] ${over ? "text-red-400" : "text-gray-400"}`}>
            Hiện: {current}%
          </span>
          <span className="font-mono text-[10px] text-green-400">Target: {target}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {over && (
        <p className="font-mono text-[10px] text-red-400 mt-0.5">
          ▲ Đang vượt {current - target}% — cần giảm
        </p>
      )}
    </div>
  );
}

// ─── M1 Checklist ─────────────────────────────────────────────────────────────

function M1Checklist({ data }: { data: ASAData }) {
  const sr = (data.accounts.M1.safetyRatio ?? 0.5) * 100;
  const checks = [
    { label: "① Catalyst rõ ngày cụ thể", ok: true, note: "VPB · CAEX" },
    { label: "② Giữ < 5 phiên", ok: true, note: "OK" },
    { label: "③ X1 đang có lãi", ok: false, note: "Cần xác nhận" },
    { label: "④ Safety Ratio > 45%", ok: sr > 45, note: Math.round(sr) + "% hiện tại" },
    { label: "⑤ Net > 30% margin cost", ok: true, note: "OK" },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const decision = passed >= 5 ? "TĂNG" : passed >= 3 ? "GIỮ NGUYÊN" : "GIẢM";
  const decisionColor = passed >= 5 ? "text-green-400" : passed >= 3 ? "text-amber-400" : "text-red-400";
  const decisionBg = passed >= 5 ? "bg-green-900/40" : passed >= 3 ? "bg-amber-900/40" : "bg-red-900/40";

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4">
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">
        M1 Decision Engine
      </p>
      <div className="flex flex-col gap-2 mb-3">
        {checks.map((c, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="font-mono text-xs text-gray-400">{c.label}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${c.ok ? "bg-green-900/60 text-green-300" : "bg-red-900/60 text-red-300"}`}>
              {c.note}
            </span>
          </div>
        ))}
      </div>
      <div className={`flex justify-between items-center rounded-lg px-3 py-2 ${decisionBg}`}>
        <span className="font-mono text-xs font-semibold text-gray-200">
          Kết luận M1 hôm nay
        </span>
        <span className={`font-mono text-sm font-bold ${decisionColor}`}>{decision}</span>
      </div>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ onDataLoaded }: { onDataLoaded: (d: ASAData) => void }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    setStatus("loading");
    // Với ảnh/PDF: gọi AI để parse — hiện tại mock ngay
    // Sau này: gọi Claude API để OCR
    await new Promise((r) => setTimeout(r, 800));
    const today = new Date().toISOString().slice(0, 10);
    const data = { ...MOCK_DATA, date: today, uploadedAt: new Date().toISOString() };
    onDataLoaded(data);
    setStatus("done");
  }, [onDataLoaded]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
        ${dragging ? "border-purple-500 bg-purple-950/20" : "border-gray-700 hover:border-gray-600 bg-gray-900/40"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.json"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-gray-400">Đang đọc file...</p>
        </div>
      ) : status === "done" ? (
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-green-900/60 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l4 4 6-7" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-mono text-xs text-green-400">Đã tải · nhấn để cập nhật</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-600">
            <path d="M12 4v12m0-12L8 8m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="font-mono text-xs text-gray-500">
            Kéo thả ảnh chụp màn hình TPBS / VBSE hoặc file PDF / JSON
          </p>
          <p className="font-mono text-[10px] text-gray-700">
            Cần: ① Danh mục X1 &nbsp;② Danh mục M1 &nbsp;③ Tiền mặt &nbsp;④ VBSE &nbsp;⑤ PDF giao dịch
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Execution Steps ──────────────────────────────────────────────────────────

function ExecSteps({ signals }: { signals: Signal[] }) {
  const sells = signals.filter((s) => s.type === "SELL");
  const buys  = signals.filter((s) => s.type === "BUY");
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setDone((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const steps = [
    ...sells.map((s, i) => ({
      color: "text-red-400",
      dot: "bg-red-500",
      text: `Mở ${s.broker} → BÁN ${s.ma} ${s.sl.toLocaleString()} cp giá ${s.giaDat}`,
      sub: `Tài khoản ${s.tk} · ${s.lyDo}`,
    })),
    ...buys.map((s) => ({
      color: "text-green-400",
      dot: "bg-green-500",
      text: `Mở ${s.broker} → MUA ${s.ma} ${s.sl.toLocaleString()} cp vùng ${s.giaDat}`,
      sub: `Tài khoản ${s.tk} · Chỉ sau khi bán xong · ${s.lyDo}`,
    })),
    {
      color: "text-amber-400",
      dot: "bg-amber-500",
      text: "Kiểm tra M1 Safety Ratio sau khi hoàn thành các bước trên",
      sub: "Nếu ratio > 45% → OK. Nếu vẫn < 40% → upload lại để ASA tính tiếp",
    },
  ];

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4">
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">
        Thứ tự thực hiện hôm nay
      </p>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex gap-3 cursor-pointer group ${done.has(i) ? "opacity-40" : ""}`}
            onClick={() => toggle(i)}
          >
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white flex-shrink-0
                ${done.has(i) ? "bg-gray-700" : step.dot}`}>
                {done.has(i) ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && <div className="w-px h-full bg-gray-800 min-h-[12px]" />}
            </div>
            <div className="pb-2">
              <p className={`font-mono text-xs font-medium leading-tight ${done.has(i) ? "line-through text-gray-600" : step.color}`}>
                {step.text}
              </p>
              <p className="font-mono text-[10px] text-gray-600 mt-0.5 leading-tight">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Snowball Projection ──────────────────────────────────────────────────────

function SnowballProjection({ nav }: { nav: number }) {
  const [rate, setRate] = useState(5);
  const months = [1, 3, 6, 12, 24, 36];
  const project = (m: number) => nav * Math.pow(1 + rate / 100, m);

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          Snowball Projection (lãi kép)
        </p>
        <div className="flex items-center gap-2">
          <input
            type="range" min={1} max={10} step={0.5} value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-20 accent-purple-500"
          />
          <span className="font-mono text-xs text-purple-400 w-10">{rate}%/tháng</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((m) => (
          <div key={m} className="bg-gray-800/60 rounded-lg px-3 py-2">
            <p className="font-mono text-[10px] text-gray-500 mb-1">T+{m}</p>
            <p className="font-mono text-sm font-medium text-white">
              {project(m) >= 1e9 ? fmtTr(project(m)) : Math.round(project(m) / 1e6) + " tr"}
            </p>
            <p className="font-mono text-[10px] text-green-400">
              +{((project(m) / nav - 1) * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-gray-700 mt-2">
        * (1 + {rate}%)^n — lãi kép thực tế, không phải {rate} × n = {rate * 12}%/năm
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ASADashboard() {
  const [data, setData] = useState<ASAData>(MOCK_DATA);
  const [sigFilter, setSigFilter] = useState<"ALL" | "BUY" | "SELL" | "WATCH" | "HOLD">("ALL");

  const signals = computeSignals(data);
  const filteredSigs = sigFilter === "ALL" ? signals : signals.filter((s) => s.type === sigFilter);
  const nav = totalNav(data);
  const net = data.transactions_yesterday.netProfit;
  const sr = safRatio(data);
  const mu = m1UsagePct(data);

  const srColor = sr < 30 ? "text-red-400" : sr < 40 ? "text-amber-400" : "text-green-400";
  const muColor = mu > 70 ? "text-red-400" : mu > 60 ? "text-amber-400" : "text-green-400";

  return (
    <div className="space-y-5 pb-8">

      {/* Upload */}
      <UploadZone onDataLoaded={setData} />

      {/* Header pulse */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-xs text-gray-400">
            ASA · {new Date(data.uploadedAt).toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-mono text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded">
            X1: {fmt(data.accounts.X1.vonGoc / 1e6)}tr gốc
          </span>
          <span className="font-mono text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded">
            M1: {fmt(data.accounts.M1.vonGoc / 1e6)}tr gốc
          </span>
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "NAV_real hôm nay", value: fmt(nav / 1e6) + " tr", sub: "X1 + M1 thị giá", sub2: "" },
          { label: "M1 Safety Ratio", value: sr + "%", sub: "Ngưỡng call: 30%", color: srColor },
          { label: "M1 Usage", value: mu + "%", sub: "Target < 60%", color: muColor },
          { label: "Net hôm qua", value: "+" + fmt(net / 1e6) + " tr", sub: "Sau phí · margin · tax", color: "text-green-400" },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3">
            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wide mb-1">{c.label}</p>
            <p className={`font-mono text-xl font-semibold ${c.color ?? "text-white"}`}>{c.value}</p>
            <p className="font-mono text-[10px] text-gray-600 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Signals */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Lệnh ASA hôm nay — anh thực hiện trên app
          </p>
          <div className="flex gap-1">
            {(["ALL","BUY","SELL","WATCH","HOLD"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSigFilter(f)}
                className={`font-mono text-[10px] px-2.5 py-1 rounded transition-all
                  ${sigFilter === f
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300"}`}
              >
                {f === "ALL" ? "Tất cả" : f}
                <span className="ml-1 text-[9px] opacity-60">
                  {f === "ALL" ? signals.length : signals.filter(s => s.type === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {filteredSigs.map((sig, i) => (
            <SignalCard key={i} sig={sig} idx={i} />
          ))}
        </div>
      </div>

      {/* Ratio + Steps */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Tỷ lệ danh mục — hiện tại vs target
          </p>
          <RatioBar label="Core" maCodes="VIC · DGC · FPT · VHM" current={48} target={50} color="bg-green-600" />
          <RatioBar label="Sóng ngành" maCodes="TCB · MBB · SSI · SHS" current={22} target={25} color="bg-blue-600" />
          <RatioBar label="High-beta HNX" maCodes="NAG · HQC · CEO · VIX · VOS" current={20} target={15} color="bg-red-600" />
          <RatioBar label="Chờ catalyst" maCodes="GAS · PVD · DCM · DPM" current={10} target={10} color="bg-gray-600" />
        </div>
        <ExecSteps signals={signals} />
      </div>

      {/* M1 + Snowball */}
      <div className="grid grid-cols-2 gap-4">
        <M1Checklist data={data} />
        <SnowballProjection nav={nav} />
      </div>

      {/* Holdings table */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">
          Toàn bộ holdings — X1 + M1
        </p>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-gray-800">
                {["Mã", "TK", "SL", "Giá TB", "Giá HT", "P&L%", "Tầng", "Catalyst"].map((h) => (
                  <th key={h} className="text-left font-mono text-[10px] text-gray-500 pb-2 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data.accounts.X1.holdings, ...data.accounts.M1.holdings].map((h, i) => (
                <tr key={i} className="border-b border-gray-900 hover:bg-gray-800/30 transition-colors">
                  <td className="font-mono text-sm font-semibold text-white py-2 pr-3">{h.ma}</td>
                  <td className="py-2 pr-3">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${h.tk === "X1" ? "bg-green-900/50 text-green-300" : "bg-amber-900/50 text-amber-300"}`}>
                      {h.tk}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-gray-300 py-2 pr-3">{h.sl.toLocaleString()}</td>
                  <td className="font-mono text-xs text-gray-300 py-2 pr-3">{h.giaTB.toLocaleString("vi-VN")}</td>
                  <td className="font-mono text-xs text-gray-300 py-2 pr-3">{h.giaHienTai.toLocaleString("vi-VN")}</td>
                  <td className={`font-mono text-xs font-medium py-2 pr-3 ${h.plPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {h.plPercent >= 0 ? "+" : ""}{h.plPercent.toFixed(2)}%
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-mono text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{h.tang}</span>
                  </td>
                  <td className="font-mono text-[10px] text-gray-500 py-2">{h.catalyst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-800">
        <span className="font-mono text-[10px] text-gray-700">
          ASA OPC · AItrify FSO v2.1 · Human executes — AI calculates
        </span>
        <span className="font-mono text-[10px] text-gray-700">
          Mục tiêu 700tr trước 10/6/2026
        </span>
      </div>

    </div>
  );
}
