"use client";

import { useState, useEffect, useCallback } from "react";
import CloudMonitorDashboard from "@/components/zemmer-cloud-monitor";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://aitrify-auth-api.hoangn-ahg.workers.dev";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Enterprise {
  id: string; name: string; company: string;
  email: string; email_domain: string; status: string; created_at: number;
}
interface AgentRequest {
  id: string; instance_name: string; status: string;
  requested_at: number; approved_at: number | null; approved_by: string | null;
  enterprise_name: string; company: string; enterprise_email: string;
  agent_type_name: string; industry: string;
}


// ---------------------------------------------------------------------------
// Log types
// ---------------------------------------------------------------------------
interface LogRow {
  id: string; timestamp: string; service: string; agent: string;
  level: string; message: string; trace_id: string;
  user_login: string; duration_ms: number; metadata: string; app: string; created_at: string;
}
interface LogCost {
  today_writes: number; month_writes: number; d1_free_limit: number;
  cost_usd_estimate: number;
  by_service: {service: string; n: number}[];
  by_level: {level: string; n: number}[];
}
type EntTab = "all" | "pending_review" | "active" | "rejected";
type AgTab  = "all" | "pending" | "active" | "rejected";
type Section = "enterprises" | "agent_requests" | "cloud_monitor" | "system_logs";

// ---------------------------------------------------------------------------
// Badge configs
// ---------------------------------------------------------------------------
const ENT_BADGE: Record<string, { label: string; cls: string }> = {
  pending_email:  { label: "Chờ xác minh", cls: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20" },
  pending_review: { label: "Chờ duyệt",    cls: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20" },
  active:         { label: "Đã duyệt",     cls: "bg-green-500/10  text-green-400  ring-1 ring-green-500/20"  },
  suspended:      { label: "Đã khóa",      cls: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20" },
  rejected:       { label: "Từ chối",      cls: "bg-red-500/10    text-red-400    ring-1 ring-red-500/20"    },
};
const AG_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Chờ duyệt",      cls: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20" },
  active:    { label: "Đã duyệt",       cls: "bg-green-500/10  text-green-400  ring-1 ring-green-500/20"  },
  suspended: { label: "Tạm dừng",       cls: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20" },
  rejected:  { label: "Từ chối",        cls: "bg-red-500/10    text-red-400    ring-1 ring-red-500/20"    },
};
const AGENT_ICONS: Record<string, string> = {
  LISA: "⛳", ANNA: "❄️", NAGA: "🔧", FIRESAFE: "🔥", MOBI: "📱",
};

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------
function Toast({ toast }: { toast: { msg: string; type: "success" | "error" } }) {
  return (
    <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-xl ${
      toast.type === "success"
        ? "border-green-500/20 bg-green-500/10 text-green-400"
        : "border-red-500/20 bg-red-500/10 text-red-400"
    }`}>
      {toast.type === "success"
        ? <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
        : <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
      }
      {toast.msg}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <svg className="h-6 w-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );
}

function RejectModal({ title, subtitle, onConfirm, onCancel, loading }: {
  title: string; subtitle: string;
  onConfirm: (reason: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-700/50 bg-gray-900 p-6 shadow-2xl">
        <h3 className="mb-1 font-nacelle text-lg font-semibold text-gray-100">{title}</h3>
        <p className="mb-5 text-sm text-gray-500">{subtitle}</p>
        <label className="mb-1.5 block text-sm font-medium text-indigo-200/65">
          Lý do <span className="text-gray-600">(không bắt buộc)</span>
        </label>
        <textarea
          className="form-input w-full resize-none"
          rows={3}
          placeholder="Nhập lý do từ chối..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="btn bg-gray-800 text-gray-300 hover:bg-gray-700">Huỷ</button>
          <button onClick={() => onConfirm(reason)} disabled={loading} className="btn bg-red-600 text-white hover:bg-red-500 disabled:opacity-60">
            {loading ? "Đang xử lý…" : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);
  const [authError, setAuthError] = useState("");

  const [section, setSection] = useState<Section>("enterprises");
  const [toast, setToast]     = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Enterprise state
  const [enterprises, setEnterprises]     = useState<Enterprise[]>([]);
  const [entTab, setEntTab]               = useState<EntTab>("pending_review");
  const [entLoading, setEntLoading]       = useState(false);
  const [entCounts, setEntCounts]         = useState<Record<EntTab, number>>({ all: 0, pending_review: 0, active: 0, rejected: 0 });
  const [entActing, setEntActing]         = useState<string | null>(null);
  const [entRejectTarget, setEntRejectTarget] = useState<Enterprise | null>(null);

  // Agent requests state
  const [agentRequests, setAgentRequests] = useState<AgentRequest[]>([]);
  const [agTab, setAgTab]                 = useState<AgTab>("pending");
  const [agLoading, setAgLoading]         = useState(false);
  const [agCounts, setAgCounts]           = useState<Record<AgTab, number>>({ all: 0, pending: 0, active: 0, rejected: 0 });
  const [agActing, setAgActing]           = useState<string | null>(null);
  const [agRejectTarget, setAgRejectTarget] = useState<AgentRequest | null>(null);


  // Log state
  const LOG_URL = process.env.NEXT_PUBLIC_LOG_COLLECTOR_URL || "https://log-collector.hoangn-ahg.workers.dev";
  const LOG_TOKEN = process.env.NEXT_PUBLIC_LOG_COLLECTOR_TOKEN || "";
  const [logs, setLogs]           = useState<LogRow[]>([]);
  const [logTotal, setLogTotal]   = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [logCost, setLogCost]     = useState<LogCost | null>(null);
  const [logPage, setLogPage]     = useState(0);
  const [logLevel, setLogLevel]   = useState("");
  const [logService, setLogService] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logLive, setLogLive]     = useState(false);
  const LOG_LIMIT = 20;
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Persist auth
  useEffect(() => {
    const saved = sessionStorage.getItem("aitrify_admin_secret");
    if (saved) { setPassword(saved); setAuthed(true); }
  }, []);

  // ── Fetch enterprises ──
  const fetchEnterprises = useCallback(async (secret: string, filter: EntTab) => {
    setEntLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`${AUTH_API_URL}/admin/enterprises${qs}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("aitrify_admin_secret");
        setAuthed(false); setAuthError("Sai mật khẩu hoặc phiên đã hết hạn."); return;
      }
      const data = await res.json() as { success: boolean; enterprises: Enterprise[] };
      if (data.success) {
        setEnterprises(data.enterprises);
        if (filter === "all") {
          const c = { all: 0, pending_review: 0, active: 0, rejected: 0 } as Record<EntTab, number>;
          for (const e of data.enterprises) {
            c.all++;
            if (e.status === "pending_review") c.pending_review++;
            if (e.status === "active")         c.active++;
            if (e.status === "rejected")       c.rejected++;
          }
          setEntCounts(c);
        }
      }
    } catch { showToast("Lỗi kết nối.", "error"); }
    finally { setEntLoading(false); }
  }, []);

  // ── Fetch agent requests ──
  const fetchAgentRequests = useCallback(async (secret: string, filter: AgTab) => {
    setAgLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`${AUTH_API_URL}/admin/agent-requests${qs}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("aitrify_admin_secret");
        setAuthed(false); setAuthError("Sai mật khẩu hoặc phiên đã hết hạn."); return;
      }
      const data = await res.json() as { success: boolean; requests: AgentRequest[] };
      if (data.success) {
        setAgentRequests(data.requests);
        if (filter === "all") {
          const c = { all: 0, pending: 0, active: 0, rejected: 0 } as Record<AgTab, number>;
          for (const r of data.requests) {
            c.all++;
            if (r.status === "pending")  c.pending++;
            if (r.status === "active")   c.active++;
            if (r.status === "rejected") c.rejected++;
          }
          setAgCounts(c);
        }
      }
    } catch { showToast("Lỗi kết nối.", "error"); }
    finally { setAgLoading(false); }
  }, []);

  useEffect(() => {
    if (!authed) return;
    if (section === "enterprises") fetchEnterprises(password, entTab);
  }, [authed, section, entTab, password, fetchEnterprises]);

  useEffect(() => {
    if (!authed) return;
    if (section === "agent_requests") fetchAgentRequests(password, agTab);
  }, [authed, section, agTab, password, fetchAgentRequests]);

  const refreshEnterprises = () =>
    fetchEnterprises(password, "all").then(() => fetchEnterprises(password, entTab));
  const refreshAgentReqs = () =>
    fetchAgentRequests(password, "all").then(() => fetchAgentRequests(password, agTab));


  // ── Fetch logs ──
  const fetchLogs = useCallback(async (page = 0, level = "", service = "", q = "") => {
    setLogLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LOG_LIMIT),
        offset: String(page * LOG_LIMIT),
        ...(level   ? { level }   : {}),
        ...(service ? { service } : {}),
        ...(q       ? { q }       : {}),
      });
      const res = await fetch(`${LOG_URL}/logs?${params}`, {
        headers: { "X-Log-Token": LOG_TOKEN },
      });
      const data = await res.json() as { ok: boolean; total: number; rows: LogRow[] };
      if (data.ok) { setLogs(data.rows); setLogTotal(data.total); }
    } catch { showToast("Lỗi tải logs.", "error"); }
    finally { setLogLoading(false); }
  }, [LOG_URL, LOG_TOKEN]);

  const fetchLogCost = useCallback(async () => {
    try {
      const res = await fetch(`${LOG_URL}/logs/cost`, { headers: { "X-Log-Token": LOG_TOKEN } });
      const data = await res.json() as { ok: boolean } & LogCost;
      if (data.ok) setLogCost(data);
    } catch { /* silent */ }
  }, [LOG_URL, LOG_TOKEN]);

  useEffect(() => {
    if (!authed || section !== "system_logs") return;
    fetchLogs(logPage, logLevel, logService, logSearch);
    fetchLogCost();
  }, [authed, section, logPage, logLevel, logService, logSearch, fetchLogs, fetchLogCost]);

  useEffect(() => {
    if (!logLive || section !== "system_logs") return;
    const id = setInterval(() => fetchLogs(0, logLevel, logService, logSearch), 5000);
    return () => clearInterval(id);
  }, [logLive, section, logLevel, logService, logSearch, fetchLogs]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    sessionStorage.setItem("aitrify_admin_secret", password);
    setAuthed(true); setAuthError("");
  }

  // Enterprise actions
  async function handleEntApprove(ent: Enterprise) {
    setEntActing(ent.id);
    try {
      const res = await fetch(`${AUTH_API_URL}/admin/enterprises/${ent.id}/approve`, {
        method: "POST", headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) { showToast(data.message || "Đã duyệt tài khoản.", "success"); refreshEnterprises(); }
      else showToast(data.error || "Duyệt thất bại.", "error");
    } catch { showToast("Lỗi kết nối.", "error"); }
    finally { setEntActing(null); }
  }
  async function handleEntRejectConfirm(reason: string) {
    if (!entRejectTarget) return;
    setEntActing(entRejectTarget.id);
    try {
      const res = await fetch(`${AUTH_API_URL}/admin/enterprises/${entRejectTarget.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${password}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) { showToast(data.message || "Đã từ chối.", "success"); setEntRejectTarget(null); refreshEnterprises(); }
      else showToast(data.error || "Thất bại.", "error");
    } catch { showToast("Lỗi kết nối.", "error"); }
    finally { setEntActing(null); }
  }

  // Agent request actions
  async function handleAgApprove(req: AgentRequest) {
    setAgActing(req.id);
    try {
      const res = await fetch(`${AUTH_API_URL}/admin/agent-requests/${req.id}/approve`, {
        method: "POST", headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) { showToast(data.message || "Đã duyệt agent request.", "success"); refreshAgentReqs(); }
      else showToast(data.error || "Duyệt thất bại.", "error");
    } catch { showToast("Lỗi kết nối.", "error"); }
    finally { setAgActing(null); }
  }
  async function handleAgRejectConfirm(reason: string) {
    if (!agRejectTarget) return;
    setAgActing(agRejectTarget.id);
    try {
      const res = await fetch(`${AUTH_API_URL}/admin/agent-requests/${agRejectTarget.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${password}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) { showToast(data.message || "Đã từ chối.", "success"); setAgRejectTarget(null); refreshAgentReqs(); }
      else showToast(data.error || "Thất bại.", "error");
    } catch { showToast("Lỗi kết nối.", "error"); }
    finally { setAgActing(null); }
  }

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="font-nacelle text-2xl font-semibold text-gray-100">AItrify Admin</h1>
            <p className="mt-1 text-sm text-gray-600">Nhập mật khẩu để tiếp tục</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" className="form-input w-full" placeholder="Admin password"
              value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {authError && <p className="text-sm text-red-400">{authError}</p>}
            <button type="submit" className="btn w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  return (
    <>
      {toast && <Toast toast={toast} />}

      {/* Enterprise reject modal */}
      {entRejectTarget && (
        <RejectModal
          title="Từ chối tài khoản"
          subtitle={`${entRejectTarget.name} — ${entRejectTarget.email}`}
          onConfirm={handleEntRejectConfirm}
          onCancel={() => setEntRejectTarget(null)}
          loading={entActing === entRejectTarget.id}
        />
      )}

      {/* Agent reject modal */}
      {agRejectTarget && (
        <RejectModal
          title="Từ chối Agent Request"
          subtitle={`${agRejectTarget.company} — ${agRejectTarget.agent_type_name} "${agRejectTarget.instance_name}"`}
          onConfirm={handleAgRejectConfirm}
          onCancel={() => setAgRejectTarget(null)}
          loading={agActing === agRejectTarget.id}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-nacelle text-2xl font-semibold text-gray-100">AItrify Admin</h1>
          <button
            onClick={() => { sessionStorage.removeItem("aitrify_admin_secret"); setAuthed(false); setPassword(""); }}
            className="btn-sm rounded-lg border border-gray-700/50 bg-gray-800/50 text-gray-400 hover:text-gray-200"
          >
            Đăng xuất
          </button>
        </div>

        {/* Section switcher */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-700/40 bg-gray-900/50 p-1 w-fit">
          {([
            { id: "enterprises"    as Section, label: "Tài khoản DN",    count: entCounts.pending_review },
            { id: "agent_requests" as Section, label: "Agent Requests",  count: agCounts.pending },
            { id: "cloud_monitor"  as Section, label: "Cloud Monitor",   count: 0 },
            { id: "system_logs"    as Section, label: "System Logs",     count: 0 },
          ]).map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                section === s.id ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {s.label}
              {s.count > 0 && (
                <span className="ml-1.5 rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-xs text-indigo-300">{s.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── ENTERPRISES SECTION ── */}
        {section === "enterprises" && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["all","pending_review","active","rejected"] as EntTab[]).map((t) => (
                <div key={t} className="rounded-xl border border-gray-700/40 bg-gray-900/50 p-4">
                  <p className="text-xs text-gray-600">{{ all:"Tất cả", pending_review:"Chờ duyệt", active:"Đã duyệt", rejected:"Từ chối" }[t]}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-200">{entCounts[t]}</p>
                </div>
              ))}
            </div>

            <div className="mb-5 flex gap-1 rounded-xl border border-gray-700/40 bg-gray-900/50 p-1 w-fit">
              {(["all","pending_review","active","rejected"] as EntTab[]).map((t) => (
                <button key={t} onClick={() => setEntTab(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${entTab===t ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {{ all:"Tất cả", pending_review:"Chờ duyệt", active:"Đã duyệt", rejected:"Từ chối" }[t]}
                  {t === "pending_review" && entCounts.pending_review > 0 && (
                    <span className="ml-1.5 rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-xs text-indigo-300">{entCounts.pending_review}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-700/40 bg-gray-900/50">
              {entLoading ? <Spinner /> : enterprises.length === 0 ? (
                <div className="py-20 text-center text-sm text-gray-600">Không có tài khoản nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700/40 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        <th className="px-5 py-3">Họ tên</th><th className="px-5 py-3">Công ty</th>
                        <th className="px-5 py-3">Email</th><th className="px-5 py-3 whitespace-nowrap">Ngày đăng ký</th>
                        <th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {enterprises.map((e) => {
                        const badge = ENT_BADGE[e.status] ?? { label: e.status, cls: "bg-gray-700 text-gray-400" };
                        const isPending = e.status === "pending_review";
                        const isActing  = entActing === e.id;
                        return (
                          <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                            <td className="px-5 py-4 font-medium text-gray-200">{e.name}</td>
                            <td className="px-5 py-4 text-gray-400">{e.company}</td>
                            <td className="px-5 py-4 text-indigo-300">{e.email}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-gray-500">{formatDate(e.created_at)}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {isPending ? (
                                  <>
                                    <button onClick={() => handleEntApprove(e)} disabled={isActing}
                                      className="rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20 hover:bg-green-600/30 disabled:opacity-50">
                                      {isActing ? "…" : "Duyệt"}
                                    </button>
                                    <button onClick={() => setEntRejectTarget(e)} disabled={isActing}
                                      className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20 hover:bg-red-600/30 disabled:opacity-50">
                                      Từ chối
                                    </button>
                                  </>
                                ) : <span className="text-xs text-gray-700">—</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="mt-4 text-right text-xs text-gray-700">{enterprises.length} tài khoản</p>
          </>
        )}

        {/* ── AGENT REQUESTS SECTION ── */}
        {section === "agent_requests" && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["all","pending","active","rejected"] as AgTab[]).map((t) => (
                <div key={t} className="rounded-xl border border-gray-700/40 bg-gray-900/50 p-4">
                  <p className="text-xs text-gray-600">{{ all:"Tất cả", pending:"Chờ duyệt", active:"Đã duyệt", rejected:"Từ chối" }[t]}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-200">{agCounts[t]}</p>
                </div>
              ))}
            </div>

            <div className="mb-5 flex gap-1 rounded-xl border border-gray-700/40 bg-gray-900/50 p-1 w-fit">
              {(["all","pending","active","rejected"] as AgTab[]).map((t) => (
                <button key={t} onClick={() => setAgTab(t)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${agTab===t ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {{ all:"Tất cả", pending:"Chờ duyệt", active:"Đã duyệt", rejected:"Từ chối" }[t]}
                  {t === "pending" && agCounts.pending > 0 && (
                    <span className="ml-1.5 rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-xs text-indigo-300">{agCounts.pending}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-700/40 bg-gray-900/50">
              {agLoading ? <Spinner /> : agentRequests.length === 0 ? (
                <div className="py-20 text-center text-sm text-gray-600">Không có agent request nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700/40 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        <th className="px-5 py-3">Agent Type</th><th className="px-5 py-3">Tên Instance</th>
                        <th className="px-5 py-3">Công ty</th><th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3 whitespace-nowrap">Ngày request</th>
                        <th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {agentRequests.map((r) => {
                        const badge    = AG_BADGE[r.status] ?? { label: r.status, cls: "bg-gray-700 text-gray-400" };
                        const isPending = r.status === "pending";
                        const isActing  = agActing === r.id;
                        return (
                          <tr key={r.id} className="hover:bg-gray-800/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span>{AGENT_ICONS[r.agent_type_name] ?? "🤖"}</span>
                                <div>
                                  <p className="font-semibold text-gray-200">{r.agent_type_name}</p>
                                  <p className="text-xs text-gray-600">{r.industry}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-indigo-300 max-w-[160px] truncate">{r.instance_name}</td>
                            <td className="px-5 py-4 text-gray-400">{r.company}</td>
                            <td className="px-5 py-4 text-gray-500 text-xs">{r.enterprise_email}</td>
                            <td className="px-5 py-4 whitespace-nowrap text-gray-500">{formatDate(r.requested_at)}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {isPending ? (
                                  <>
                                    <button onClick={() => handleAgApprove(r)} disabled={isActing}
                                      className="rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20 hover:bg-green-600/30 disabled:opacity-50">
                                      {isActing ? "…" : "Duyệt"}
                                    </button>
                                    <button onClick={() => setAgRejectTarget(r)} disabled={isActing}
                                      className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20 hover:bg-red-600/30 disabled:opacity-50">
                                      Từ chối
                                    </button>
                                  </>
                                ) : <span className="text-xs text-gray-700">—</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="mt-4 text-right text-xs text-gray-700">{agentRequests.length} requests</p>
          </>
        )}


        {/* ── SYSTEM LOGS SECTION ── */}
        {section === "system_logs" && (
          <div className="space-y-5">
            {/* Cost bar */}
            {logCost && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-gray-700/40 bg-gray-900/50 px-5 py-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${logCost.today_writes / logCost.d1_free_limit > 0.8 ? "bg-red-400" : logCost.today_writes / logCost.d1_free_limit > 0.5 ? "bg-yellow-400" : "bg-green-400"}`}/>
                  <span className="text-gray-500">D1 writes hôm nay:</span>
                  <span className="font-semibold text-gray-300">{logCost.today_writes.toLocaleString()} / {logCost.d1_free_limit.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400"/>
                  <span className="text-gray-500">Tháng này:</span>
                  <span className="font-semibold text-gray-300">{logCost.month_writes.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400"/>
                  <span className="text-gray-500">Chi phí ước tính:</span>
                  <span className="font-semibold text-green-400">~${logCost.cost_usd_estimate.toFixed(3)}/tháng</span>
                </div>
                <button onClick={fetchLogCost} className="ml-auto text-gray-600 hover:text-gray-400 transition-colors">↻ Refresh</button>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 uppercase tracking-wider">Level</label>
                <select value={logLevel} onChange={e => { setLogLevel(e.target.value); setLogPage(0); }}
                  className="rounded-lg border border-gray-700/40 bg-gray-900/50 px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                  <option value="">Tất cả</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 uppercase tracking-wider">Service</label>
                <select value={logService} onChange={e => { setLogService(e.target.value); setLogPage(0); }}
                  className="rounded-lg border border-gray-700/40 bg-gray-900/50 px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                  <option value="">Tất cả</option>
                  <option value="aitrify-api">aitrify-api</option>
                  <option value="baisys-api">baisys-api</option>
                  <option value="cf-auth">cf-auth</option>
                  <option value="cf-rag-search">cf-rag-search</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label className="text-xs text-gray-600 uppercase tracking-wider">Tìm kiếm</label>
                <input value={logSearch}
                  onChange={e => { setLogSearch(e.target.value); setLogPage(0); }}
                  placeholder="trace_id, message, user..."
                  className="rounded-lg border border-gray-700/40 bg-gray-900/50 px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 placeholder:text-gray-700"
                />
              </div>
              <button
                onClick={() => setLogLive(v => !v)}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium ring-1 transition-colors ${logLive ? "bg-green-500/10 text-green-400 ring-green-500/20" : "bg-gray-800 text-gray-500 ring-gray-700/40 hover:text-gray-300"}`}
              >
                <span className={`h-2 w-2 rounded-full ${logLive ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}/>
                {logLive ? "Live" : "Live tail"}
              </button>
              <button onClick={() => fetchLogs(logPage, logLevel, logService, logSearch)}
                className="rounded-lg border border-gray-700/40 bg-gray-800/50 px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors">
                ↻ Refresh
              </button>
              {/* Export CSV */}
              <button onClick={() => {
                const header = "timestamp,service,agent,level,message,duration_ms,trace_id,user_login\n";
                const rows = logs.map(r =>
                  [r.timestamp, r.service, r.agent, r.level,
                   '"' + r.message.replace(/"/g,"''") + '"',
                   r.duration_ms, r.trace_id, r.user_login].join(",")
                ).join("\n");
                const blob = new Blob([header + rows], { type: "text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = `aitrify-logs-${Date.now()}.csv`; a.click();
              }} className="rounded-lg border border-gray-700/40 bg-gray-800/50 px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors">
                ↓ CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-700/40 bg-gray-900/50">
              {logLoading ? <Spinner /> : logs.length === 0 ? (
                <div className="py-20 text-center text-sm text-gray-600">Không có log nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700/40 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                        <th className="px-4 py-3 whitespace-nowrap">Thời gian</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Agent</th>
                        <th className="px-4 py-3">Message</th>
                        <th className="px-4 py-3 whitespace-nowrap">Duration</th>
                        <th className="px-4 py-3">Trace ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {logs.map(r => {
                        const lvlCls = r.level === "ERROR" ? "bg-red-500/10 text-red-400 ring-red-500/20"
                          : r.level === "WARN" ? "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20"
                          : "bg-green-500/10 text-green-400 ring-green-500/20";
                        return (
                          <tr key={r.id} className="hover:bg-gray-800/40 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono">
                              {new Date(r.timestamp).toLocaleTimeString("vi-VN", { hour12: false })}
                              <span className="block text-gray-700">{new Date(r.timestamp).toLocaleDateString("vi-VN")}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${lvlCls}`}>{r.level}</span>
                            </td>
                            <td className="px-4 py-3 text-indigo-300 font-mono">{r.service}</td>
                            <td className="px-4 py-3 text-gray-400">{r.agent || "—"}</td>
                            <td className="px-4 py-3 text-gray-300 max-w-[300px] truncate" title={r.message}>{r.message}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.duration_ms > 0 ? `${r.duration_ms}ms` : "—"}</td>
                            <td className="px-4 py-3 text-gray-600 font-mono">{r.trace_id || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{logTotal} log • Trang {logPage + 1} / {Math.max(1, Math.ceil(logTotal / LOG_LIMIT))}</span>
              <div className="flex gap-2">
                <button disabled={logPage === 0} onClick={() => setLogPage(p => p - 1)}
                  className="rounded-lg border border-gray-700/40 bg-gray-800/50 px-3 py-1.5 text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-colors">← Trước</button>
                <button disabled={(logPage + 1) * LOG_LIMIT >= logTotal} onClick={() => setLogPage(p => p + 1)}
                  className="rounded-lg border border-gray-700/40 bg-gray-800/50 px-3 py-1.5 text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-colors">Sau →</button>
              </div>
            </div>
          </div>
        )}
        {/* ── CLOUD MONITOR SECTION ── */}
        {section === "cloud_monitor" && (
          <div className="-mx-4 sm:-mx-6">
            <CloudMonitorDashboard />
          </div>
        )}
      </div>
    </>
  );
}
