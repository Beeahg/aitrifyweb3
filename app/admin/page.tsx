"use client";

import { useState, useEffect, useCallback } from "react";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://aitrify-auth-api.hoangn-ahg.workers.dev";

interface Enterprise {
  id: string;
  name: string;
  company: string;
  email: string;
  email_domain: string;
  status: string;
  created_at: number;
}

type Tab = "all" | "pending_review" | "active" | "rejected";

const TAB_LABELS: Record<Tab, string> = {
  all:            "Tất cả",
  pending_review: "Chờ duyệt",
  active:         "Đã duyệt",
  rejected:       "Từ chối",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending_email:  { label: "Chờ xác minh", cls: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20" },
  pending_review: { label: "Chờ duyệt",    cls: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20" },
  active:         { label: "Đã duyệt",     cls: "bg-green-500/10  text-green-400  ring-1 ring-green-500/20"  },
  suspended:      { label: "Đã khóa",      cls: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20" },
  rejected:       { label: "Từ chối",      cls: "bg-red-500/10    text-red-400    ring-1 ring-red-500/20"    },
};

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Reject modal
// ---------------------------------------------------------------------------
function RejectModal({
  enterprise,
  onConfirm,
  onCancel,
  loading,
}: {
  enterprise: Enterprise;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-700/50 bg-gray-900 p-6 shadow-2xl">
        <h3 className="mb-1 font-nacelle text-lg font-semibold text-gray-100">
          Từ chối tài khoản
        </h3>
        <p className="mb-5 text-sm text-gray-500">
          <span className="font-medium text-gray-300">{enterprise.name}</span> —{" "}
          {enterprise.email}
        </p>
        <label className="mb-1.5 block text-sm font-medium text-indigo-200/65">
          Lý do từ chối <span className="text-gray-600">(không bắt buộc)</span>
        </label>
        <textarea
          className="form-input w-full resize-none"
          rows={3}
          placeholder="VD: Tên miền email không phải doanh nghiệp, thông tin không đầy đủ..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="btn bg-red-600 text-white hover:bg-red-500 disabled:opacity-60"
          >
            {loading ? "Đang xử lý…" : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [tab, setTab] = useState<Tab>("pending_review");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // enterprise id
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Enterprise | null>(null);

  // Counts per tab (computed from full list)
  const [counts, setCounts] = useState<Record<Tab, number>>({ all: 0, pending_review: 0, active: 0, rejected: 0 });

  // Persist auth across refreshes
  useEffect(() => {
    const saved = sessionStorage.getItem("aitrify_admin_secret");
    if (saved) { setPassword(saved); setAuthed(true); }
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEnterprises = useCallback(async (secret: string, filter: Tab) => {
    setLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`${AUTH_API_URL}/admin/enterprises${qs}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("aitrify_admin_secret");
        setAuthed(false);
        setAuthError("Sai mật khẩu hoặc phiên đã hết hạn.");
        return;
      }
      const data = await res.json() as { success: boolean; enterprises: Enterprise[] };
      if (data.success) {
        setEnterprises(data.enterprises);
        // Refresh counts from full list fetch
        if (filter === "all") {
          const c = { all: 0, pending_review: 0, active: 0, rejected: 0 } as Record<Tab, number>;
          for (const e of data.enterprises) {
            c.all++;
            if (e.status === "pending_review") c.pending_review++;
            if (e.status === "active") c.active++;
            if (e.status === "rejected") c.rejected++;
          }
          setCounts(c);
        }
      }
    } catch {
      showToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on tab change
  useEffect(() => {
    if (authed) fetchEnterprises(password, tab);
  }, [authed, tab, fetchEnterprises, password]);

  // Fetch counts (always "all") after approve/reject
  const refreshAll = () => {
    fetchEnterprises(password, "all").then(() => {
      fetchEnterprises(password, tab);
    });
  };

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    sessionStorage.setItem("aitrify_admin_secret", password);
    setAuthed(true);
    setAuthError("");
  }

  async function handleApprove(enterprise: Enterprise) {
    setActionLoading(enterprise.id);
    try {
      const res = await fetch(`${AUTH_API_URL}/admin/enterprises/${enterprise.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) {
        showToast(data.message || "Đã duyệt tài khoản.", "success");
        refreshAll();
      } else {
        showToast(data.error || "Duyệt thất bại.", "error");
      }
    } catch {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectConfirm(reason: string) {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      const res = await fetch(`${AUTH_API_URL}/admin/enterprises/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${password}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (data.success) {
        showToast(data.message || "Đã từ chối tài khoản.", "success");
        setRejectTarget(null);
        refreshAll();
      } else {
        showToast(data.error || "Từ chối thất bại.", "error");
      }
    } catch {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  // ── LOGIN SCREEN ───────────────────────────────────────────────────────────
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
            <h1 className="font-nacelle text-2xl font-semibold text-gray-100">
              AItrify Admin
            </h1>
            <p className="mt-1 text-sm text-gray-600">Nhập mật khẩu để tiếp tục</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="form-input w-full"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {authError && (
              <p className="text-sm text-red-400">{authError}</p>
            )}
            <button
              type="submit"
              className="btn w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
            >
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-xl transition-all ${
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

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          enterprise={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={actionLoading === rejectTarget.id}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-nacelle text-2xl font-semibold text-gray-100">
              Quản lý tài khoản doanh nghiệp
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              AItrify Admin Dashboard
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("aitrify_admin_secret");
              setAuthed(false);
              setPassword("");
            }}
            className="btn-sm rounded-lg border border-gray-700/50 bg-gray-800/50 text-gray-400 hover:text-gray-200"
          >
            Đăng xuất
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["all", "pending_review", "active", "rejected"] as Tab[]).map((t) => (
            <div key={t} className="rounded-xl border border-gray-700/40 bg-gray-900/50 p-4">
              <p className="text-xs text-gray-600">{TAB_LABELS[t]}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-200">{counts[t]}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex gap-1 rounded-xl border border-gray-700/40 bg-gray-900/50 p-1 w-fit">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {TAB_LABELS[t]}
              {t === "pending_review" && counts.pending_review > 0 && (
                <span className="ml-1.5 rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-xs text-indigo-300">
                  {counts.pending_review}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-700/40 bg-gray-900/50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="h-6 w-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : enterprises.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-600">
              Không có tài khoản nào trong mục này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/40 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    <th className="px-5 py-3">Họ tên</th>
                    <th className="px-5 py-3">Công ty</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3 whitespace-nowrap">Ngày đăng ký</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {enterprises.map((e) => {
                    const badge = STATUS_BADGE[e.status] ?? { label: e.status, cls: "bg-gray-700 text-gray-400" };
                    const isPending = e.status === "pending_review";
                    const isActing = actionLoading === e.id;
                    return (
                      <tr key={e.id} className="group transition-colors hover:bg-gray-800/40">
                        <td className="px-5 py-4 font-medium text-gray-200">{e.name}</td>
                        <td className="px-5 py-4 text-gray-400">{e.company}</td>
                        <td className="px-5 py-4">
                          <span className="text-indigo-300">{e.email}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-500">
                          {formatDate(e.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApprove(e)}
                                  disabled={isActing}
                                  className="rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20 transition-colors hover:bg-green-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isActing ? "…" : "Duyệt"}
                                </button>
                                <button
                                  onClick={() => setRejectTarget(e)}
                                  disabled={isActing}
                                  className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition-colors hover:bg-red-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            {!isPending && (
                              <span className="text-xs text-gray-700">—</span>
                            )}
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

        <p className="mt-4 text-right text-xs text-gray-700">
          {enterprises.length} tài khoản
        </p>
      </div>
    </>
  );
}
