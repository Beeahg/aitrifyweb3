/**
 * AItrify Auth API — Cloudflare Worker
 * Endpoints:
 *   POST /auth/register  — đăng ký tài khoản doanh nghiệp
 *   GET  /auth/verify    — xác minh email qua token
 *   POST /auth/login     — đăng nhập, trả JWT
 */

export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  FRONTEND_URL: string;
  FROM_EMAIL: string;
}

// ---------------------------------------------------------------------------
// Danh sách domain email cá nhân bị từ chối
// ---------------------------------------------------------------------------
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de", "yahoo.es", "yahoo.it",
  "yahoo.com.vn", "yahoo.com.au", "yahoo.ca",
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.it",
  "hotmail.es", "hotmail.com.vn",
  "outlook.com", "outlook.fr", "outlook.de", "outlook.es", "outlook.com.vn",
  "live.com", "live.co.uk", "live.fr", "live.com.vn",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "aol.co.uk",
  "protonmail.com", "proton.me", "pm.me",
  "mail.com", "email.com",
  "zoho.com",
  "yandex.com", "yandex.ru",
  "gmx.com", "gmx.de", "gmx.net",
  "web.de",
  "qq.com", "163.com", "126.com", "sina.com", "sina.cn", "sohu.com",
  "laposte.net", "free.fr", "orange.fr", "wanadoo.fr",
  "libero.it",
  "rediffmail.com",
  "inbox.com",
  "fastmail.com", "fastmail.fm",
  "tutanota.com", "tutamail.com",
  "hey.com",
  "rocketmail.com",
  "aim.com",
  "mail.ru", "list.ru", "bk.ru", "inbox.ru",
  "trashmail.com", "guerrillamail.com", "mailinator.com", "tempmail.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "spam4.me",
]);

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

/**
 * Hash password với PBKDF2-SHA256, 100.000 iterations
 * Format lưu: "pbkdf2:<saltHex>:<hashHex>"
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return `pbkdf2:${toHex(salt.buffer)}:${toHex(bits)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  const saltBytes = parts[1].match(/.{2}/g)!.map((b) => parseInt(b, 16));
  const salt = new Uint8Array(saltBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex === parts[2];
}

/** Tạo JWT HS256 */
async function createJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 86_400 * 7
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const enc = new TextEncoder();
  const b64url = (s: string) =>
    btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(fullPayload));
  const signingInput = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${signingInput}.${sigB64}`;
}

/** Sinh token ngẫu nhiên 32 bytes hex */
function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Turnstile verification
// ---------------------------------------------------------------------------
async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------
function buildVerificationEmail(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác minh email — AItrify</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#030712;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:12px;padding:10px 20px;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                      ⚡ AItrify
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:48px 40px;">

              <!-- Heading -->
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">
                Xác minh địa chỉ email
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Xin chào <strong style="color:#e2e8f0;">${escapeHtml(name)}</strong>,
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.7;">
                Cảm ơn bạn đã đăng ký tài khoản doanh nghiệp tại <strong style="color:#818cf8;">AItrify</strong>.
                Để hoàn tất quá trình đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách nhấn nút bên dưới.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:10px;letter-spacing:0.2px;">
                      ✉ Xác minh Email ngay
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0;" />

              <!-- Info box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#0a0f1e;border:1px solid #1e293b;border-radius:10px;padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6366f1;letter-spacing:1px;text-transform:uppercase;">
                      Hoặc copy link sau vào trình duyệt
                    </p>
                    <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;line-height:1.6;">
                      ${escapeHtml(verifyUrl)}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;color:#475569;line-height:1.7;">
                ⏰ Link xác minh sẽ hết hạn sau <strong style="color:#94a3b8;">24 giờ</strong>.<br/>
                Nếu bạn không thực hiện đăng ký này, hãy bỏ qua email này.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 0 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#334155;">
                © ${new Date().getFullYear()} AItrify. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#1e293b;">
                Email này được gửi tự động từ hệ thống AItrify — vui lòng không reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Resend email sender
// ---------------------------------------------------------------------------
async function sendVerificationEmail(
  env: Env,
  to: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify?token=${token}`;
  const html = buildVerificationEmail(name, verifyUrl);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `AItrify <${env.FROM_EMAIL}>`,
      to: [to],
      subject: "Xác minh email đăng ký tài khoản AItrify",
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function allowedOrigins(env: Env): string[] {
  return [env.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"];
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = allowedOrigins(env);
  const ao = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": ao,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleRegister(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  let body: {
    name?: string;
    company?: string;
    email?: string;
    password?: string;
    turnstileToken?: string;
  };

  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Request body không hợp lệ." }, 400, cors);
  }

  const { name, company, email, password, turnstileToken } = body;

  // --- Basic validation ---
  if (!name?.trim() || !company?.trim() || !email?.trim() || !password || !turnstileToken) {
    return json({ success: false, error: "Vui lòng điền đầy đủ thông tin." }, 400, cors);
  }

  // --- Turnstile verification ---
  const ip = request.headers.get("CF-Connecting-IP") ?? "127.0.0.1";
  const turnstileOk = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!turnstileOk) {
    return json({ success: false, error: "Xác minh CAPTCHA thất bại. Vui lòng thử lại." }, 400, cors);
  }

  // --- Email format ---
  const emailLower = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return json({ success: false, error: "Địa chỉ email không hợp lệ." }, 400, cors);
  }

  const domain = emailLower.split("@")[1];
  if (PERSONAL_DOMAINS.has(domain)) {
    return json(
      {
        success: false,
        error: `Vui lòng sử dụng email doanh nghiệp. Email @${domain} không được chấp nhận.`,
        code: "PERSONAL_EMAIL",
      },
      400,
      cors
    );
  }

  // --- Password strength ---
  if (password.length < 8) {
    return json({ success: false, error: "Mật khẩu phải có ít nhất 8 ký tự." }, 400, cors);
  }
  if (!/[A-Z]/.test(password))
    return json({ success: false, error: "Mật khẩu phải có ít nhất 1 chữ hoa." }, 400, cors);
  if (!/[a-z]/.test(password))
    return json({ success: false, error: "Mật khẩu phải có ít nhất 1 chữ thường." }, 400, cors);
  if (!/[0-9]/.test(password))
    return json({ success: false, error: "Mật khẩu phải có ít nhất 1 chữ số." }, 400, cors);
  if (!/[^A-Za-z0-9]/.test(password))
    return json({ success: false, error: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt." }, 400, cors);

  // --- Check duplicate email ---
  const existing = await env.DB.prepare(
    "SELECT id FROM enterprises WHERE email = ?"
  )
    .bind(emailLower)
    .first<{ id: string }>();

  if (existing) {
    return json(
      { success: false, error: "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.", code: "EMAIL_EXISTS" },
      409,
      cors
    );
  }

  // --- Hash password & generate token ---
  const [passwordHash, verificationToken, id] = await Promise.all([
    hashPassword(password),
    Promise.resolve(randomToken()),
    Promise.resolve(crypto.randomUUID()),
  ]);

  const tokenExpiresAt = Math.floor(Date.now() / 1000) + 86_400; // 24h

  // --- Insert into D1 ---
  await env.DB.prepare(
    `INSERT INTO enterprises
       (id, name, company, email, email_domain, password_hash, status, verification_token, token_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending_email', ?, ?)`
  )
    .bind(id, name.trim(), company.trim(), emailLower, domain, passwordHash, verificationToken, tokenExpiresAt)
    .run();

  // --- Send verification email ---
  try {
    await sendVerificationEmail(env, emailLower, name.trim(), verificationToken);
  } catch (err) {
    console.error("Email send failed:", err);
    // Don't block registration — user can request resend later
  }

  return json({
    success: true,
    message: "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.",
  }, 200, cors);
}

// ---------------------------------------------------------------------------

async function handleVerify(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return json({ success: false, error: "Token không hợp lệ." }, 400, cors);
  }

  const record = await env.DB.prepare(
    "SELECT id, status, token_expires_at FROM enterprises WHERE verification_token = ?"
  )
    .bind(token)
    .first<{ id: string; status: string; token_expires_at: number }>();

  if (!record) {
    return json({ success: false, error: "Token không tồn tại hoặc đã được sử dụng.", code: "INVALID_TOKEN" }, 404, cors);
  }

  if (record.status === "active" || record.status === "pending_review") {
    return json({ success: true, message: "Email đã được xác minh trước đó.", alreadyVerified: true }, 200, cors);
  }

  const now = Math.floor(Date.now() / 1000);
  if (record.token_expires_at < now) {
    return json({ success: false, error: "Link xác minh đã hết hạn (24 giờ). Vui lòng đăng ký lại.", code: "TOKEN_EXPIRED" }, 410, cors);
  }

  await env.DB.prepare(
    `UPDATE enterprises
     SET status = 'pending_review',
         verification_token = NULL,
         token_expires_at = NULL,
         updated_at = unixepoch()
     WHERE id = ?`
  )
    .bind(record.id)
    .run();

  return json({
    success: true,
    message: "Email xác minh thành công! Tài khoản của bạn đang chờ được duyệt. Chúng tôi sẽ liên hệ trong 1–2 ngày làm việc.",
  }, 200, cors);
}

// ---------------------------------------------------------------------------

async function handleLogin(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Request body không hợp lệ." }, 400, cors);
  }

  const { email, password } = body;
  if (!email?.trim() || !password) {
    return json({ success: false, error: "Vui lòng nhập email và mật khẩu." }, 400, cors);
  }

  const emailLower = email.trim().toLowerCase();
  const record = await env.DB.prepare(
    "SELECT id, name, company, email, status, password_hash FROM enterprises WHERE email = ?"
  )
    .bind(emailLower)
    .first<{ id: string; name: string; company: string; email: string; status: string; password_hash: string }>();

  if (!record) {
    return json({ success: false, error: "Email hoặc mật khẩu không chính xác." }, 401, cors);
  }

  const passwordOk = await verifyPassword(password, record.password_hash);
  if (!passwordOk) {
    return json({ success: false, error: "Email hoặc mật khẩu không chính xác." }, 401, cors);
  }

  if (record.status === "pending_email") {
    return json({ success: false, error: "Vui lòng xác minh email trước khi đăng nhập.", code: "UNVERIFIED_EMAIL" }, 403, cors);
  }
  if (record.status === "pending_review") {
    return json({ success: false, error: "Tài khoản đang chờ xét duyệt. Chúng tôi sẽ thông báo qua email.", code: "PENDING_REVIEW" }, 403, cors);
  }
  if (record.status === "suspended") {
    return json({ success: false, error: "Tài khoản đã bị tạm khóa. Vui lòng liên hệ support@aitrify.com.", code: "SUSPENDED" }, 403, cors);
  }

  const token = await createJWT(
    { sub: record.id, email: record.email, name: record.name, company: record.company },
    env.JWT_SECRET
  );

  return json({
    success: true,
    token,
    user: { id: record.id, name: record.name, company: record.company, email: record.email },
  }, 200, cors);
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/auth/register" && request.method === "POST") {
        return handleRegister(request, env, cors);
      }
      if (url.pathname === "/auth/verify" && request.method === "GET") {
        return handleVerify(request, env, cors);
      }
      if (url.pathname === "/auth/login" && request.method === "POST") {
        return handleLogin(request, env, cors);
      }

      return json({ error: "Not found" }, 404, cors);
    } catch (err) {
      console.error("Unhandled error:", err);
      return json({ success: false, error: "Lỗi hệ thống. Vui lòng thử lại sau." }, 500, cors);
    }
  },
};
