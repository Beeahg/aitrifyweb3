"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";

// Domain email cá nhân bị từ chối (đồng bộ với worker)
const PERSONAL_DOMAINS = new Set([
  "gmail.com","googlemail.com","yahoo.com","yahoo.co.uk","yahoo.fr","yahoo.de",
  "yahoo.es","yahoo.it","yahoo.com.vn","hotmail.com","hotmail.co.uk","hotmail.fr",
  "hotmail.de","hotmail.it","hotmail.com.vn","outlook.com","outlook.fr","outlook.de",
  "outlook.com.vn","live.com","live.co.uk","live.fr","live.com.vn","icloud.com",
  "me.com","mac.com","aol.com","protonmail.com","proton.me","pm.me","mail.com",
  "zoho.com","yandex.com","yandex.ru","gmx.com","gmx.de","gmx.net","web.de",
  "qq.com","163.com","126.com","sina.com","rocketmail.com","aim.com",
  "mail.ru","list.ru","bk.ru","inbox.ru","trashmail.com","guerrillamail.com",
  "mailinator.com","tempmail.com","fastmail.com","tutanota.com","hey.com",
]);

function getEmailWarning(email: string): string | null {
  if (!email.includes("@")) return null;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (PERSONAL_DOMAINS.has(domain))
    return `Email @${domain} là email cá nhân. Vui lòng dùng email doanh nghiệp (VD: ban@congty.com).`;
  return null;
}

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://aitrify-auth-api.hoangn-ahg.workers.dev";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, opts: object) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type FormState = "idle" | "loading" | "success" | "error";

export default function SignUp() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileRef.current) return;
    if (widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
      theme: "dark",
      language: "vi",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
  }, []);

  useEffect(() => {
    if (turnstileReady) renderTurnstile();
  }, [turnstileReady, renderTurnstile]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  function handleEmailChange(val: string) {
    setEmail(val);
    setEmailWarning(getEmailWarning(val));
  }

  function resetTurnstile() {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setTurnstileToken(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !company.trim() || !email.trim() || !password) {
      setErrorMsg("Vui lòng điền đầy đủ tất cả các trường bắt buộc.");
      return;
    }
    if (emailWarning) {
      setErrorMsg("Vui lòng dùng email doanh nghiệp để đăng ký.");
      return;
    }
    if (!turnstileToken) {
      setErrorMsg("Vui lòng hoàn thành xác minh CAPTCHA.");
      return;
    }

    setFormState("loading");

    try {
      const res = await fetch(`${AUTH_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, password, turnstileToken }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        setFormState("success");
      } else {
        setErrorMsg(data.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
        setFormState("error");
        resetTurnstile();
      }
    } catch {
      setErrorMsg("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
      setFormState("error");
      resetTurnstile();
    }
  }

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (formState === "success") {
    return (
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            <div className="mx-auto max-w-[480px] text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
                  <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
              </div>

              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                Kiểm tra email của bạn
              </h1>

              <p className="mt-4 text-base text-indigo-200/60 leading-relaxed">
                Chúng tôi đã gửi link xác minh đến{" "}
                <span className="font-medium text-indigo-300">{email}</span>.
                Vui lòng kiểm tra hộp thư (kể cả thư mục spam) và nhấn link để kích hoạt tài khoản.
              </p>

              <div className="mt-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 text-sm text-indigo-200/50 leading-relaxed">
                Link sẽ hết hạn sau{" "}
                <span className="font-medium text-indigo-300">24 giờ</span>.
                Sau khi xác minh email, tài khoản của bạn sẽ được AItrify xét duyệt trong 1–2 ngày làm việc.
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/login"
                  className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
                >
                  Đến trang đăng nhập
                </Link>
                <button
                  onClick={() => {
                    setFormState("idle");
                    setName(""); setCompany(""); setEmail(""); setPassword("");
                    setEmailWarning(null);
                    setTimeout(resetTurnstile, 100);
                  }}
                  className="btn relative bg-linear-to-b from-gray-800 to-gray-800/60 bg-[length:100%_100%] bg-[bottom] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%]"
                >
                  Đăng ký tài khoản khác
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onReady={() => setTurnstileReady(true)}
      />

      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="pb-12 text-center">
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                Tạo tài khoản AItrify
              </h1>
              <p className="mt-3 text-sm text-indigo-200/50">
                Dành cho tài khoản doanh nghiệp — vui lòng dùng email công ty
              </p>
            </div>

            {/* Form */}
            <form className="mx-auto max-w-[400px]" onSubmit={handleSubmit} noValidate>
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="name">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-input w-full"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={formState === "loading"}
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="company">
                    Tên công ty <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    className="form-input w-full"
                    placeholder="Công ty TNHH ABC"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    disabled={formState === "loading"}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="email">
                    Email doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-input w-full transition-colors ${
                      emailWarning
                        ? "border-amber-500/60 focus:border-amber-500"
                        : email && !emailWarning && email.includes("@") && email.split("@")[1]?.includes(".")
                        ? "border-green-500/50 focus:border-green-500"
                        : ""
                    }`}
                    placeholder="ban@congty.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    disabled={formState === "loading"}
                  />
                  {emailWarning && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-400">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <span>{emailWarning}</span>
                    </div>
                  )}
                  {email && !emailWarning && email.includes("@") && email.split("@")[1]?.includes(".") && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-green-400">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Email doanh nghiệp hợp lệ
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="password">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-input w-full pr-10"
                      placeholder="Ít nhất 8 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={formState === "loading"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {[
                        { label: "8+ ký tự", ok: password.length >= 8 },
                        { label: "Chữ hoa (A-Z)", ok: /[A-Z]/.test(password) },
                        { label: "Chữ thường (a-z)", ok: /[a-z]/.test(password) },
                        { label: "Số + ký tự đặc biệt", ok: /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) },
                      ].map((item) => (
                        <div key={item.label} className={`flex items-center gap-1 text-xs ${item.ok ? "text-green-400" : "text-gray-600"}`}>
                          <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            {item.ok ? (
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            ) : (
                              <circle cx="10" cy="10" r="8" opacity="0.3" />
                            )}
                          </svg>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Turnstile */}
                <div>
                  <div ref={turnstileRef} className="flex justify-center" />
                  {!turnstileReady && (
                    <p className="text-center text-xs text-gray-600">Đang tải xác minh bảo mật…</p>
                  )}
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6 space-y-5">
                <button
                  type="submit"
                  disabled={formState === "loading" || !!emailWarning}
                  className="btn w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formState === "loading" ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xử lý…
                    </span>
                  ) : (
                    "Đăng ký tài khoản"
                  )}
                </button>

                <div className="flex items-center gap-3 text-center text-sm italic text-gray-600 before:h-px before:flex-1 before:bg-linear-to-r before:from-transparent before:via-gray-400/25 after:h-px after:flex-1 after:bg-linear-to-r after:from-transparent after:via-gray-400/25">
                  hoặc
                </div>

                <button
                  type="button"
                  className="btn relative w-full bg-linear-to-b from-gray-800 to-gray-800/60 bg-[length:100%_100%] bg-[bottom] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%]"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Đăng ký với Google
                </button>
              </div>

              <p className="mt-5 text-center text-xs text-gray-600 leading-relaxed">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Điều khoản dịch vụ</Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Chính sách bảo mật</Link>.
              </p>
            </form>

            <div className="mt-6 text-center text-sm text-indigo-200/65">
              Bạn đã có tài khoản AItrify?{" "}
              <Link className="font-medium text-indigo-500" href="/login">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
