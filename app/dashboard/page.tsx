"use client";

import { useState, useEffect, useCallback } from "react";
import CloudMonitorDashboard from "@/components/zemmer-cloud-monitor";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://aitrify-auth-api.hoangn-ahg.workers.dev";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface JWTClaims {
  sub: string; email: string; name: string; company: string; exp: number;
}
interface AgentInstance {
  id: string; instance_name: string; status: string;
  requested_at: number; approved_at: number | null;
  agent_type_name: string; description: string; industry: string;
}
interface AgentType {
  id: string; name: string; description: string; industry: string;
}
interface Profile {
  id: string; name: string; company: string; email: string;
  email_domain: string; status: string; created_at: number;
}

// ---------------------------------------------------------------------------
// JWT decode (client-side, không verify — worker đã verify)
// ---------------------------------------------------------------------------
function decodeToken(token: string): JWTClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as JWTClaims;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AGENT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Chờ duyệt", cls: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20" },
  active:    { label: "Đang hoạt động", cls: "bg-green-500/10 text-green-400 ring-1 ring-green-500/20" },
  suspended: { label: "Tạm dừng", cls: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20" },
  rejected:  { label: "Từ chối", cls: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" },
};

const ACCOUNT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending_email:  { label: "Chờ xác minh email", cls: "text-yellow-400" },
  pending_review: { label: "Chờ xét duyệt",       cls: "text-indigo-400" },
  active:         { label: "Đang hoạt động",       cls: "text-green-400"  },
  suspended:      { label: "Tạm khóa",             cls: "text-orange-400" },
  rejected:       { label: "Từ chối",              cls: "text-red-400"    },
};

const AGENT_ICONS: Record<string, string> = {
  LISA: "⛳", ANNA: "❄️", NAGA: "🔧", FIRESAFE: "🔥", MOBI: "📱",
};

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Request Agent Modal
// ---------------------------------------------------------------------------
function RequestAgentModal({
  agentTypes,
  onSubmit,
  onClose,
  loading,
  error,
}: {
  agentTypes: AgentType[];
  onSubmit: (agentTypeId: string, instanceName: string) => void;
  onClose: () => void;
  loading: boolean;
  error: string;
}) {
  const [selectedType, setSelectedType] = useState("");
  const [instanceName, setInstanceName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-700/50 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="font-nacelle text-lg font-semibold text-gray-100">Request AI Agent mới</h3>
            <p className="mt-0.5 text-sm text-gray-600">Chọn loại agent và đặt tên riêng cho chatbox của bạn</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Agent type selection */}
        <div className="mb-4">
          <p className="mb-2.5 text-sm font-medium text-indigo-200/65">Chọn loại Agent</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {agentTypes.map((at) => (
              <button
                key={at.id}
                type="button"
                onClick={() => setSelectedType(at.id)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                  selectedType === at.id
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-gray-700/40 bg-gray-800/40 hover:border-gray-600/50"
                }`}
              >
                <span className="text-2xl leading-none">{AGENT_ICONS[at.name] ?? "🤖"}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{at.name}</p>
                  <p className="text-xs text-gray-600">{at.industry}</p>
                </div>
                {selectedType === at.id && (
                  <svg className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Instance name */}
        <div className="mb-2">
          <label className="mb-1.5 block text-sm font-medium text-indigo-200/65">
            Tên chatbox của bạn <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="form-input w-full"
            placeholder="VD: Trợ lý ANNA của Cty Điều Hòa Miền Nam"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            maxLength={80}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-700">
            Tên này sẽ hiển thị trên chatbox của bạn với khách hàng.
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="btn bg-gray-800 text-gray-300 hover:bg-gray-700">
            Huỷ
          </button>
          <button
            onClick={() => {
              if (!selectedType) return;
              onSubmit(selectedType, instanceName);
            }}
            disabled={loading || !selectedType || !instanceName.trim()}
            className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang gửi…
              </span>
            ) : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav item
// ---------------------------------------------------------------------------
type Section = "overview" | "agents" | "profile" | "cloud";
const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  },
  {
    id: "agents",
    label: "AI Agents của tôi",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.81-1.407 2.674L16.5 19.05M5 14.5l-1.402 1.402C2.598 16.902 3.568 18.71 5.005 18.574L8.5 18.25" /></svg>,
  },
  {
    id: "profile",
    label: "Hồ sơ công ty",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>,
  },
  {
    id: "cloud",
    label: "Hạ tầng Cloud",
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" /></svg>,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [user, setUser]       = useState<JWTClaims | null>(null);
  const [token, setToken]     = useState("");
  const [section, setSection] = useState<Section>("overview");

  // Data
  const [agents, setAgents]    = useState<AgentInstance[]>([]);
  const [profile, setProfile]  = useState<Profile | null>(null);
  const [agentTypes, setAgentTypes] = useState<AgentType[]>([]);

  // UI state
  const [agentsLoading, setAgentsLoading]   = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [modalLoading, setModalLoading]     = useState(false);
  const [modalError, setModalError]         = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName]             = useState("");
  const [editCompany, setEditCompany]       = useState("");
  const [profileSaving, setProfileSaving]   = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth check on mount
  useEffect(() => {
    const t = localStorage.getItem("aitrify_token");
    if (!t) { window.location.href = "/login"; return; }
    const claims = decodeToken(t);
    if (!claims) { localStorage.removeItem("aitrify_token"); window.location.href = "/login"; return; }
    setToken(t);
    setUser(claims);
  }, []);

  const apiFetch = useCallback((path: string, opts?: RequestInit) =>
    fetch(`${AUTH_API_URL}${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts?.headers },
    }), [token]);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    if (!token) return;
    setAgentsLoading(true);
    try {
      const res  = await apiFetch("/user/agents");
      const data = await res.json() as { success: boolean; agents: AgentInstance[] };
      if (data.success) setAgents(data.agents);
    } finally { setAgentsLoading(false); }
  }, [token, apiFetch]);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    try {
      const res  = await apiFetch("/user/profile");
      const data = await res.json() as { success: boolean; profile: Profile };
      if (data.success) setProfile(data.profile);
    } finally { setProfileLoading(false); }
  }, [token, apiFetch]);

  // Fetch public agent types (for modal)
  const fetchAgentTypes = useCallback(async () => {
    if (agentTypes.length > 0) return;
    const res  = await fetch(`${AUTH_API_URL}/agents`);
    const data = await res.json() as { success: boolean; agents: AgentType[] };
    if (data.success) setAgentTypes(data.agents);
  }, [agentTypes.length]);

  // Load data on section change
  useEffect(() => {
    if (!token) return;
    if (section === "overview" || section === "agents") fetchAgents();
    if (section === "profile") fetchProfile();
  }, [section, token, fetchAgents, fetchProfile]);

  async function handleRequestAgent(agentTypeId: string, instanceName: string) {
    setModalLoading(true);
    setModalError("");
    try {
      const res  = await apiFetch("/user/agents/request", {
        method: "POST",
        body:   JSON.stringify({ agent_type_id: agentTypeId, instance_name: instanceName }),
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) {
        showToast(data.message || "Yêu cầu đã được gửi!", "success");
        setShowModal(false);
        fetchAgents();
      } else {
        setModalError(data.error || "Gửi yêu cầu thất bại.");
      }
    } catch {
      setModalError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setModalLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("aitrify_token");
    window.location.href = "/login";
  }

  async function handleSaveProfile() {
    setProfileSaving(true);
    try {
      const res  = await apiFetch("/user/profile", {
        method: "PUT",
        body:   JSON.stringify({ name: editName.trim(), company: editCompany.trim() }),
      });
      const data = await res.json() as { success: boolean; token?: string; error?: string };
      if (data.success) {
        if (data.token) {
          localStorage.setItem("aitrify_token", data.token);
          const claims = decodeToken(data.token);
          if (claims) setUser(claims);
          setToken(data.token);
        }
        setEditingProfile(false);
        fetchProfile();
        showToast("Cập nhật thành công", "success");
      } else {
        showToast(data.error || "Cập nhật thất bại.", "error");
      }
    } catch {
      showToast("Lỗi kết nối. Vui lòng thử lại.", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  if (!user) return null; // Đang redirect

  const agentCounts = {
    active:  agents.filter((a) => a.status === "active").length,
    pending: agents.filter((a) => a.status === "pending").length,
    total:   agents.length,
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toast && (
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
      )}

      {/* Request modal */}
      {showModal && (
        <RequestAgentModal
          agentTypes={agentTypes}
          onSubmit={handleRequestAgent}
          onClose={() => { setShowModal(false); setModalError(""); }}
          loading={modalLoading}
          error={modalError}
        />
      )}

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* ── Sidebar ── */}
        <aside className="hidden w-56 shrink-0 border-r border-gray-800/60 bg-gray-950/50 md:flex md:flex-col">
          <div className="px-4 py-6">
            <p className="mb-0.5 text-sm font-semibold text-gray-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-600 truncate">{user.company}</p>
          </div>
          <nav className="flex-1 px-3 pb-4 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  section === item.id
                    ? "bg-indigo-600/20 text-indigo-300"
                    : "text-gray-500 hover:bg-gray-800/60 hover:text-gray-300"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="border-t border-gray-800/60 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-800/60 hover:text-gray-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* ── Mobile top nav ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-800/60 bg-gray-950 md:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                section === item.id ? "text-indigo-400" : "text-gray-600"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto px-4 py-8 pb-24 sm:px-8 md:pb-8">

          {/* ── OVERVIEW ── */}
          {section === "overview" && (
            <div>
              <h2 className="font-nacelle text-2xl font-semibold text-gray-100">
                Xin chào, {user.name.split(" ").slice(-1)[0]} 👋
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Đây là tổng quan tài khoản doanh nghiệp AItrify của bạn
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5">
                  <p className="text-xs text-gray-600 uppercase tracking-wider">AI Agents Active</p>
                  <p className="mt-2 text-4xl font-semibold text-gray-100">{agentCounts.active}</p>
                  <p className="mt-1 text-xs text-green-400">Đang hoạt động</p>
                </div>
                <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5">
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Chờ duyệt</p>
                  <p className="mt-2 text-4xl font-semibold text-gray-100">{agentCounts.pending}</p>
                  <p className="mt-1 text-xs text-indigo-400">Đang xét duyệt</p>
                </div>
                <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5">
                  <p className="text-xs text-gray-600 uppercase tracking-wider">Tổng Agents</p>
                  <p className="mt-2 text-4xl font-semibold text-gray-100">{agentCounts.total}</p>
                  <p className="mt-1 text-xs text-gray-600">Tất cả requests</p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-8">
                <h3 className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Thao tác nhanh</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => { setSection("agents"); fetchAgentTypes(); setTimeout(() => setShowModal(true), 100); }}
                    className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-left hover:bg-indigo-500/10 transition-colors"
                  >
                    <span className="text-2xl">🤖</span>
                    <div>
                      <p className="text-sm font-semibold text-indigo-300">Request AI Agent mới</p>
                      <p className="text-xs text-gray-600">Thêm agent cho doanh nghiệp của bạn</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSection("profile")}
                    className="flex items-center gap-3 rounded-xl border border-gray-700/40 bg-gray-900/50 p-4 text-left hover:bg-gray-800/60 transition-colors"
                  >
                    <span className="text-2xl">🏢</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-300">Xem hồ sơ công ty</p>
                      <p className="text-xs text-gray-600">Thông tin tài khoản doanh nghiệp</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── AGENTS ── */}
          {section === "agents" && (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-nacelle text-2xl font-semibold text-gray-100">AI Agents của tôi</h2>
                  <p className="mt-1 text-sm text-gray-600">Quản lý các AI Agent đang sử dụng</p>
                </div>
                <button
                  onClick={() => { fetchAgentTypes(); setShowModal(true); }}
                  className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white text-sm shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                >
                  <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Request Agent mới
                </button>
              </div>

              {agentsLoading ? (
                <div className="flex justify-center py-20">
                  <svg className="h-6 w-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              ) : agents.length === 0 ? (
                <div className="mt-16 text-center">
                  <span className="text-5xl">🤖</span>
                  <p className="mt-4 font-medium text-gray-400">Chưa có AI Agent nào</p>
                  <p className="mt-1 text-sm text-gray-600">Request agent đầu tiên để bắt đầu sử dụng AItrify</p>
                  <button
                    onClick={() => { fetchAgentTypes(); setShowModal(true); }}
                    className="btn mt-6 bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                  >
                    Request AI Agent đầu tiên
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((ag) => {
                    const badge = AGENT_STATUS_BADGE[ag.status] ?? { label: ag.status, cls: "bg-gray-700 text-gray-400" };
                    return (
                      <div key={ag.id} className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <span className="text-3xl">{AGENT_ICONS[ag.agent_type_name] ?? "🤖"}</span>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-200">{ag.instance_name}</p>
                        <p className="mt-0.5 text-xs text-indigo-400 font-medium">{ag.agent_type_name}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{ag.industry}</p>
                        <p className="mt-3 text-xs text-gray-700">
                          Request: {formatDate(ag.requested_at)}
                          {ag.approved_at && ` · Active: ${formatDate(ag.approved_at)}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE ── */}
          {section === "profile" && (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-nacelle text-2xl font-semibold text-gray-100">Hồ sơ công ty</h2>
                  <p className="mt-1 text-sm text-gray-600">Thông tin tài khoản doanh nghiệp AItrify</p>
                </div>
                {!editingProfile && !profileLoading && (
                  <button
                    onClick={() => {
                      setEditName(profile?.name ?? user.name);
                      setEditCompany(profile?.company ?? user.company);
                      setEditingProfile(true);
                    }}
                    className="btn bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                  >
                    <svg className="mr-1.5 h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {profileLoading ? (
                <div className="flex justify-center py-20">
                  <svg className="h-6 w-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              ) : (
                <div className="mt-6 max-w-lg">
                  {editingProfile ? (
                    <div className="rounded-2xl border border-indigo-500/30 bg-gray-900/50 p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-indigo-200/65">Họ và tên</label>
                          <input
                            type="text"
                            className="form-input w-full"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={profileSaving}
                            maxLength={100}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-indigo-200/65">Tên công ty</label>
                          <input
                            type="text"
                            className="form-input w-full"
                            value={editCompany}
                            onChange={(e) => setEditCompany(e.target.value)}
                            disabled={profileSaving}
                            maxLength={100}
                          />
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end gap-3">
                        <button
                          onClick={() => setEditingProfile(false)}
                          disabled={profileSaving}
                          className="btn bg-gray-800 text-gray-300 hover:bg-gray-700"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={profileSaving || !editName.trim() || !editCompany.trim()}
                          className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {profileSaving ? (
                            <span className="flex items-center gap-2">
                              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Đang lưu…
                            </span>
                          ) : "Lưu"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 divide-y divide-gray-800/60">
                        {[
                          { label: "Họ và tên",    value: profile?.name    ?? user.name },
                          { label: "Công ty",       value: profile?.company ?? user.company },
                          { label: "Email",         value: profile?.email   ?? user.email },
                          { label: "Tên miền",      value: profile?.email_domain },
                          {
                            label: "Trạng thái",
                            value: profile?.status,
                            render: (v: string) => {
                              const s = ACCOUNT_STATUS_BADGE[v] ?? { label: v, cls: "text-gray-400" };
                              return <span className={`font-medium ${s.cls}`}>{s.label}</span>;
                            },
                          },
                          { label: "Ngày đăng ký", value: profile ? formatDate(profile.created_at) : "—" },
                        ].map((row) => (
                          <div key={row.label} className="flex justify-between gap-4 px-5 py-4">
                            <span className="text-sm text-gray-600 shrink-0">{row.label}</span>
                            <span className="text-sm text-gray-200 text-right">
                              {row.render && row.value
                                ? row.render(row.value as string)
                                : (row.value ?? "—")}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-xl border border-gray-800/60 bg-gray-900/30 p-4 text-sm text-gray-600 leading-relaxed">
                        Để cập nhật thông tin hoặc thay đổi mật khẩu, vui lòng liên hệ{" "}
                        <a href="mailto:support@aitrify.com" className="text-indigo-400 hover:text-indigo-300">
                          support@aitrify.com
                        </a>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ── CLOUD ── */}
          {section === "cloud" && (
            <div className="-mx-4 -my-8 sm:-mx-8">
              <CloudMonitorDashboard />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
