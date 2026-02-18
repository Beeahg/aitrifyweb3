"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://aitrify-auth-api.hoangn-ahg.workers.dev";

type VerifyState = "loading" | "success" | "already_verified" | "expired" | "invalid" | "error";

interface VerifyResult {
  state: VerifyState;
  message: string;
}

export default function VerifyPage() {
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setResult({ state: "invalid", message: "Link xác minh không hợp lệ. Token không tồn tại trong URL." });
      return;
    }

    fetch(`${AUTH_API_URL}/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data: { success: boolean; message?: string; error?: string; alreadyVerified?: boolean; code?: string }) => {
        if (data.success && data.alreadyVerified) {
          setResult({ state: "already_verified", message: data.message || "Email đã được xác minh trước đó." });
        } else if (data.success) {
          setResult({ state: "success", message: data.message || "Xác minh email thành công!" });
        } else if (data.code === "TOKEN_EXPIRED") {
          setResult({ state: "expired", message: data.error || "Link xác minh đã hết hạn." });
        } else if (data.code === "INVALID_TOKEN") {
          setResult({ state: "invalid", message: data.error || "Token không hợp lệ." });
        } else {
          setResult({ state: "error", message: data.error || "Xác minh thất bại. Vui lòng thử lại." });
        }
      })
      .catch(() => {
        setResult({ state: "error", message: "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại." });
      });
  }, []);

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="mx-auto max-w-[480px] text-center">

            {/* Loading */}
            {!result && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/20">
                    <svg className="h-8 w-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                </div>
                <h1 className="font-nacelle text-2xl font-semibold text-gray-200">
                  Đang xác minh email…
                </h1>
                <p className="mt-3 text-sm text-indigo-200/50">
                  Vui lòng chờ trong giây lát
                </p>
              </>
            )}

            {/* Success */}
            {result?.state === "success" && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
                    <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                  Email đã xác minh!
                </h1>
                <p className="mt-4 text-base text-indigo-200/60 leading-relaxed">
                  {result.message}
                </p>
                <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-sm text-indigo-200/50 leading-relaxed">
                  Đội ngũ AItrify sẽ xem xét tài khoản doanh nghiệp của bạn và gửi thông báo qua email trong{" "}
                  <span className="font-medium text-green-400">1–2 ngày làm việc</span>.
                </div>
                <div className="mt-8">
                  <Link
                    href="/signin"
                    className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                  >
                    Đến trang đăng nhập
                  </Link>
                </div>
              </>
            )}

            {/* Already verified */}
            {result?.state === "already_verified" && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
                    <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h1 className="font-nacelle text-3xl font-semibold text-gray-200 md:text-4xl">
                  Email đã được xác minh
                </h1>
                <p className="mt-4 text-base text-indigo-200/60 leading-relaxed">
                  {result.message}
                </p>
                <div className="mt-8">
                  <Link
                    href="/signin"
                    className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                  >
                    Đăng nhập
                  </Link>
                </div>
              </>
            )}

            {/* Expired */}
            {result?.state === "expired" && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
                    <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h1 className="font-nacelle text-3xl font-semibold text-gray-200 md:text-4xl">
                  Link đã hết hạn
                </h1>
                <p className="mt-4 text-base text-indigo-200/60 leading-relaxed">
                  {result.message}
                </p>
                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-indigo-200/50 leading-relaxed">
                  Link xác minh chỉ có hiệu lực trong <span className="font-medium text-amber-400">24 giờ</span>.
                  Vui lòng đăng ký lại để nhận link mới.
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/signup"
                    className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                  >
                    Đăng ký lại
                  </Link>
                  <Link
                    href="/"
                    className="btn relative bg-linear-to-b from-gray-800 to-gray-800/60 bg-[length:100%_100%] bg-[bottom] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%]"
                  >
                    Trang chủ
                  </Link>
                </div>
              </>
            )}

            {/* Invalid / Error */}
            {(result?.state === "invalid" || result?.state === "error") && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
                    <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                </div>
                <h1 className="font-nacelle text-3xl font-semibold text-gray-200 md:text-4xl">
                  Xác minh thất bại
                </h1>
                <p className="mt-4 text-base text-indigo-200/60 leading-relaxed">
                  {result.message}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/signup"
                    className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                  >
                    Đăng ký tài khoản
                  </Link>
                  <Link
                    href="/"
                    className="btn relative bg-linear-to-b from-gray-800 to-gray-800/60 bg-[length:100%_100%] bg-[bottom] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%]"
                  >
                    Trang chủ
                  </Link>
                </div>

                <p className="mt-6 text-xs text-gray-600">
                  Cần hỗ trợ?{" "}
                  <a href="mailto:support@aitrify.com" className="text-indigo-400 hover:text-indigo-300">
                    support@aitrify.com
                  </a>
                </p>
              </>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
