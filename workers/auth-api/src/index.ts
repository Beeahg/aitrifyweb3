/**
 * AItrify Auth API — Cloudflare Worker
 *
 * Public:
 *   POST /auth/register                        — đăng ký tài khoản doanh nghiệp
 *   GET  /auth/verify                          — xác minh email qua token
 *   POST /auth/login                           — đăng nhập, trả JWT
 *   GET  /agents                               — danh sách loại agent (public)
 *
 * User (JWT Bearer):
 *   GET  /user/profile                         — thông tin tài khoản
 *   GET  /user/agents                          — danh sách agent instances của user
 *   POST /user/agents/request                  — yêu cầu sử dụng agent
 *
 * Admin (ADMIN_SECRET Bearer):
 *   GET  /admin/enterprises?status=...         — danh sách tài khoản doanh nghiệp
 *   POST /admin/enterprises/:id/approve        — duyệt tài khoản
 *   POST /admin/enterprises/:id/reject         — từ chối tài khoản
 *   GET  /admin/agent-requests?status=...      — danh sách yêu cầu agent
 *   POST /admin/agent-requests/:id/approve     — duyệt yêu cầu agent
 *   POST /admin/agent-requests/:id/reject      — từ chối yêu cầu agent
 */

export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  FRONTEND_URL: string;
  FROM_EMAIL: string;
  ADMIN_SECRET: string;
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
  // btoa() chỉ xử lý Latin-1 — encode UTF-8 bytes trước để hỗ trợ tiếng Việt
  const b64url = (s: string) => {
    const bytes = enc.encode(s);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  };
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

/** Verify JWT HS256, trả claims nếu hợp lệ, null nếu invalid/expired */
async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["verify"]
    );
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(`${header}.${payload}`));
    if (!valid) return null;
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp === "number" && claims.exp < now) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Trích xuất và verify JWT từ Authorization header */
async function getAuthUser(request: Request, env: Env): Promise<Record<string, unknown> | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyJWT(auth.slice(7), env.JWT_SECRET);
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
// Email templates — Approve / Reject
// ---------------------------------------------------------------------------
function buildApproveEmail(name: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tài khoản AItrify đã được kích hoạt</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#030712;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:12px;padding:10px 20px;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ AItrify</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:48px 40px;">
              <div style="display:inline-block;background:#16a34a1a;border:1px solid #16a34a33;border-radius:8px;padding:8px 16px;margin-bottom:24px;">
                <span style="font-size:13px;font-weight:600;color:#4ade80;">✓ Tài khoản đã được kích hoạt</span>
              </div>
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">
                Chúc mừng, ${escapeHtml(name)}!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.7;">
                Tài khoản doanh nghiệp AItrify của bạn đã được <strong style="color:#4ade80;">xét duyệt và kích hoạt thành công</strong>.
                Bạn có thể đăng nhập ngay để bắt đầu sử dụng nền tảng AI của chúng tôi.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:10px;">
                      Đăng nhập AItrify
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0;" />
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">
                Cần hỗ trợ? Liên hệ <a href="mailto:support@aitrify.com" style="color:#6366f1;text-decoration:none;">support@aitrify.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 0 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#334155;">© ${new Date().getFullYear()} AItrify. All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#1e293b;">Email này được gửi tự động — vui lòng không reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildRejectEmail(name: string, reason?: string): string {
  const reasonBlock = reason
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
         <tr>
           <td style="background:#0a0f1e;border:1px solid #1e293b;border-left:3px solid #6366f1;border-radius:8px;padding:16px 20px;">
             <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">Lý do</p>
             <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">${escapeHtml(reason)}</p>
           </td>
         </tr>
       </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tài khoản AItrify chưa được duyệt</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#030712;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:12px;padding:10px 20px;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ AItrify</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:48px 40px;">
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">
                Xin chào ${escapeHtml(name)},
              </h1>
              <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.7;">
                Sau khi xem xét, đội ngũ AItrify rất tiếc thông báo rằng tài khoản doanh nghiệp của bạn
                <strong style="color:#f87171;">chưa đáp ứng đủ điều kiện</strong> để được kích hoạt tại thời điểm này.
              </p>
              ${reasonBlock}
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.7;">
                Nếu bạn có câu hỏi hoặc muốn cung cấp thêm thông tin, hãy liên hệ trực tiếp với chúng tôi.
                Chúng tôi sẵn lòng xem xét lại nếu có thông tin bổ sung phù hợp.
              </p>
              <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0;" />
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">
                Liên hệ: <a href="mailto:support@aitrify.com" style="color:#6366f1;text-decoration:none;">support@aitrify.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 0 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#334155;">© ${new Date().getFullYear()} AItrify. All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#1e293b;">Email này được gửi tự động — vui lòng không reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendApproveEmail(env: Env, to: string, name: string): Promise<void> {
  const loginUrl = `${env.FRONTEND_URL}/login`;
  const html = buildApproveEmail(name, loginUrl);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `AItrify <${env.FROM_EMAIL}>`,
      to: [to],
      subject: "🎉 Tài khoản AItrify của bạn đã được kích hoạt!",
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
}

async function sendRejectEmail(env: Env, to: string, name: string, reason?: string): Promise<void> {
  const html = buildRejectEmail(name, reason);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `AItrify <${env.FROM_EMAIL}>`,
      to: [to],
      subject: "Thông báo về tài khoản AItrify của bạn",
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
}

function buildAgentApproveEmail(name: string, instanceName: string, agentType: string, dashboardUrl: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Agent đã được kích hoạt</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#030712;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:12px;padding:10px 20px;">
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ AItrify</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:48px 40px;">
              <div style="display:inline-block;background:#16a34a1a;border:1px solid #16a34a33;border-radius:8px;padding:8px 16px;margin-bottom:24px;">
                <span style="font-size:13px;font-weight:600;color:#4ade80;">✓ AI Agent đã được kích hoạt</span>
              </div>
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#f1f5f9;letter-spacing:-0.5px;">
                Xin chào ${escapeHtml(name)}!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.7;">
                AI Agent <strong style="color:#f1f5f9;">${escapeHtml(instanceName)}</strong> (loại <strong style="color:#a5b4fc;">${escapeHtml(agentType)}</strong>)
                của doanh nghiệp bạn đã được <strong style="color:#4ade80;">xét duyệt và kích hoạt thành công</strong>.
                Bạn có thể vào dashboard để quản lý agent ngay bây giờ.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#0a0f1e;border:1px solid #1e293b;border-left:3px solid #6366f1;border-radius:8px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">Thông tin Agent</p>
                    <p style="margin:0 0 4px;font-size:14px;color:#f1f5f9;"><strong>Tên:</strong> <span style="color:#a5b4fc;">${escapeHtml(instanceName)}</span></p>
                    <p style="margin:0;font-size:14px;color:#f1f5f9;"><strong>Loại:</strong> <span style="color:#a5b4fc;">${escapeHtml(agentType)}</span></p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:10px;">
                      Vào Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0;" />
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">
                Cần hỗ trợ? Liên hệ <a href="mailto:support@aitrify.com" style="color:#6366f1;text-decoration:none;">support@aitrify.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 0 0;">
              <p style="margin:0 0 8px;font-size:13px;color:#334155;">© ${new Date().getFullYear()} AItrify. All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#1e293b;">Email này được gửi tự động — vui lòng không reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendAgentApproveEmail(env: Env, to: string, name: string, instanceName: string, agentType: string): Promise<void> {
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
  const html = buildAgentApproveEmail(name, instanceName, agentType, dashboardUrl);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `AItrify <${env.FROM_EMAIL}>`,
      to: [to],
      subject: `🤖 AI Agent ${instanceName} của bạn đã được kích hoạt!`,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function allowedOrigins(env: Env): string[] {
  return [
    "https://aitrify.com",
    "https://www.aitrify.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
  ];
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = allowedOrigins(env);
  const ao = origin && allowed.includes(origin) ? origin : "https://aitrify.com";
  return {
    "Access-Control-Allow-Origin": ao,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
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
// Agent & User handlers
// ---------------------------------------------------------------------------

/** GET /agents — danh sách agent types đang active (public) */
async function handleGetAgentTypes(env: Env, cors: Record<string, string>): Promise<Response> {
  const result = await env.DB.prepare(
    "SELECT id, name, description, industry FROM agent_types WHERE status = 'active' ORDER BY name"
  ).all<{ id: string; name: string; description: string; industry: string }>();
  return json({ success: true, agents: result.results }, 200, cors);
}

/** GET /user/profile — thông tin doanh nghiệp của user hiện tại */
async function handleUserProfile(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const user = await getAuthUser(request, env);
  if (!user) return json({ success: false, error: "Unauthorized." }, 401, cors);

  const record = await env.DB.prepare(
    "SELECT id, name, company, email, email_domain, status, created_at FROM enterprises WHERE id = ?"
  ).bind(user.sub).first<{ id: string; name: string; company: string; email: string; email_domain: string; status: string; created_at: number }>();

  if (!record) return json({ success: false, error: "Không tìm thấy tài khoản." }, 404, cors);
  return json({ success: true, profile: record }, 200, cors);
}

/** GET /user/agents — danh sách agent instances của user */
async function handleUserAgents(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const user = await getAuthUser(request, env);
  if (!user) return json({ success: false, error: "Unauthorized." }, 401, cors);

  const result = await env.DB.prepare(`
    SELECT ai.id, ai.instance_name, ai.status, ai.requested_at, ai.approved_at,
           at.name AS agent_type_name, at.description, at.industry
    FROM agent_instances ai
    JOIN agent_types at ON at.id = ai.agent_type_id
    WHERE ai.enterprise_id = ?
    ORDER BY ai.requested_at DESC
  `).bind(user.sub).all<{
    id: string; instance_name: string; status: string;
    requested_at: number; approved_at: number | null;
    agent_type_name: string; description: string; industry: string;
  }>();

  return json({ success: true, agents: result.results }, 200, cors);
}

/** POST /user/agents/request — request thêm agent mới */
async function handleUserRequestAgent(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const user = await getAuthUser(request, env);
  if (!user) return json({ success: false, error: "Unauthorized." }, 401, cors);

  let body: { agent_type_id?: string; instance_name?: string };
  try { body = await request.json(); } catch {
    return json({ success: false, error: "Request body không hợp lệ." }, 400, cors);
  }

  const { agent_type_id, instance_name } = body;
  if (!agent_type_id?.trim() || !instance_name?.trim()) {
    return json({ success: false, error: "Vui lòng chọn loại agent và nhập tên." }, 400, cors);
  }

  // Verify enterprise is active
  const enterprise = await env.DB.prepare(
    "SELECT status FROM enterprises WHERE id = ?"
  ).bind(user.sub).first<{ status: string }>();
  if (!enterprise || enterprise.status !== "active") {
    return json({ success: false, error: "Tài khoản chưa được kích hoạt." }, 403, cors);
  }

  // Verify agent type exists
  const agentType = await env.DB.prepare(
    "SELECT id FROM agent_types WHERE id = ? AND status = 'active'"
  ).bind(agent_type_id.trim()).first<{ id: string }>();
  if (!agentType) {
    return json({ success: false, error: "Loại agent không tồn tại." }, 404, cors);
  }

  // Check duplicate pending/active instance
  const existing = await env.DB.prepare(
    "SELECT id FROM agent_instances WHERE enterprise_id = ? AND agent_type_id = ? AND status IN ('pending','active')"
  ).bind(user.sub, agent_type_id.trim()).first<{ id: string }>();
  if (existing) {
    return json({ success: false, error: "Bạn đã có request đang chờ duyệt hoặc agent này đã active.", code: "DUPLICATE" }, 409, cors);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO agent_instances (id, enterprise_id, agent_type_id, instance_name) VALUES (?, ?, ?, ?)"
  ).bind(id, user.sub as string, agent_type_id.trim(), instance_name.trim()).run();

  return json({ success: true, message: "Yêu cầu đã được gửi. AItrify sẽ xét duyệt trong 1–2 ngày làm việc.", id }, 200, cors);
}

// ---------------------------------------------------------------------------
// Admin — Agent Requests handlers
// ---------------------------------------------------------------------------

interface AgentRequestRow {
  id: string; instance_name: string; status: string;
  requested_at: number; approved_at: number | null; approved_by: string | null;
  enterprise_name: string; company: string; enterprise_email: string;
  agent_type_name: string; industry: string;
}

async function handleAdminAgentRequests(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!requireAdmin(request, env)) return json({ success: false, error: "Unauthorized." }, 401, cors);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let stmt: D1PreparedStatement;
  const baseQuery = `
    SELECT ai.id, ai.instance_name, ai.status, ai.requested_at, ai.approved_at, ai.approved_by,
           e.name AS enterprise_name, e.company, e.email AS enterprise_email,
           at.name AS agent_type_name, at.industry
    FROM agent_instances ai
    JOIN enterprises e ON e.id = ai.enterprise_id
    JOIN agent_types at ON at.id = ai.agent_type_id
  `;
  if (status && status !== "all") {
    stmt = env.DB.prepare(baseQuery + " WHERE ai.status = ? ORDER BY ai.requested_at DESC").bind(status);
  } else {
    stmt = env.DB.prepare(baseQuery + " ORDER BY ai.requested_at DESC");
  }

  const result = await stmt.all<AgentRequestRow>();
  return json({ success: true, requests: result.results, total: result.results.length }, 200, cors);
}

async function handleAdminApproveAgent(id: string, request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!requireAdmin(request, env)) return json({ success: false, error: "Unauthorized." }, 401, cors);

  const record = await env.DB.prepare(`
    SELECT ai.id, ai.status, ai.instance_name,
           e.email AS enterprise_email, e.name AS enterprise_name,
           at.name AS agent_type_name
    FROM agent_instances ai
    JOIN enterprises e  ON e.id  = ai.enterprise_id
    JOIN agent_types at ON at.id = ai.agent_type_id
    WHERE ai.id = ?
  `).bind(id).first<{
    id: string; status: string; instance_name: string;
    enterprise_email: string; enterprise_name: string; agent_type_name: string;
  }>();
  if (!record) return json({ success: false, error: "Không tìm thấy request." }, 404, cors);
  if (record.status === "active") return json({ success: false, error: "Request này đã được duyệt." }, 409, cors);

  await env.DB.prepare(
    "UPDATE agent_instances SET status = 'active', approved_at = unixepoch(), approved_by = 'admin' WHERE id = ?"
  ).bind(id).run();

  try {
    await sendAgentApproveEmail(env, record.enterprise_email, record.enterprise_name, record.instance_name, record.agent_type_name);
  } catch (err) {
    console.error("Agent approve email failed:", err);
  }

  return json({ success: true, message: "Agent request đã được duyệt." }, 200, cors);
}

async function handleAdminRejectAgent(id: string, request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!requireAdmin(request, env)) return json({ success: false, error: "Unauthorized." }, 401, cors);

  const record = await env.DB.prepare(
    "SELECT id, status FROM agent_instances WHERE id = ?"
  ).bind(id).first<{ id: string; status: string }>();
  if (!record) return json({ success: false, error: "Không tìm thấy request." }, 404, cors);
  if (record.status === "rejected") return json({ success: false, error: "Request này đã bị từ chối." }, 409, cors);

  await env.DB.prepare(
    "UPDATE agent_instances SET status = 'rejected', approved_by = 'admin' WHERE id = ?"
  ).bind(id).run();

  return json({ success: true, message: "Agent request đã bị từ chối." }, 200, cors);
}

// ---------------------------------------------------------------------------
// Admin helpers + handlers
// ---------------------------------------------------------------------------

function requireAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === env.ADMIN_SECRET;
}

interface EnterpriseRow {
  id: string;
  name: string;
  company: string;
  email: string;
  email_domain: string;
  status: string;
  created_at: number;
}

async function handleAdminList(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!requireAdmin(request, env)) {
    return json({ success: false, error: "Unauthorized." }, 401, cors);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let stmt: D1PreparedStatement;
  if (status && status !== "all") {
    stmt = env.DB.prepare(
      "SELECT id, name, company, email, email_domain, status, created_at FROM enterprises WHERE status = ? ORDER BY created_at DESC"
    ).bind(status);
  } else {
    stmt = env.DB.prepare(
      "SELECT id, name, company, email, email_domain, status, created_at FROM enterprises ORDER BY created_at DESC"
    );
  }

  const result = await stmt.all<EnterpriseRow>();
  return json({ success: true, enterprises: result.results, total: result.results.length }, 200, cors);
}

async function handleAdminApprove(id: string, request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!requireAdmin(request, env)) {
    return json({ success: false, error: "Unauthorized." }, 401, cors);
  }

  const record = await env.DB.prepare(
    "SELECT id, name, email, status FROM enterprises WHERE id = ?"
  ).bind(id).first<{ id: string; name: string; email: string; status: string }>();

  if (!record) {
    return json({ success: false, error: "Không tìm thấy tài khoản." }, 404, cors);
  }
  if (record.status === "active") {
    return json({ success: false, error: "Tài khoản này đã được duyệt." }, 409, cors);
  }

  await env.DB.prepare(
    "UPDATE enterprises SET status = 'active', updated_at = unixepoch() WHERE id = ?"
  ).bind(id).run();

  try {
    await sendApproveEmail(env, record.email, record.name);
  } catch (err) {
    console.error("Approve email failed:", err);
  }

  return json({ success: true, message: `Tài khoản ${record.email} đã được duyệt.` }, 200, cors);
}

async function handleAdminReject(id: string, request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  if (!requireAdmin(request, env)) {
    return json({ success: false, error: "Unauthorized." }, 401, cors);
  }

  let body: { reason?: string } = {};
  try { body = await request.json(); } catch { /* reason is optional */ }

  const record = await env.DB.prepare(
    "SELECT id, name, email, status FROM enterprises WHERE id = ?"
  ).bind(id).first<{ id: string; name: string; email: string; status: string }>();

  if (!record) {
    return json({ success: false, error: "Không tìm thấy tài khoản." }, 404, cors);
  }
  if (record.status === "rejected") {
    return json({ success: false, error: "Tài khoản này đã bị từ chối." }, 409, cors);
  }

  await env.DB.prepare(
    "UPDATE enterprises SET status = 'rejected', updated_at = unixepoch() WHERE id = ?"
  ).bind(id).run();

  try {
    await sendRejectEmail(env, record.email, record.name, body.reason);
  } catch (err) {
    console.error("Reject email failed:", err);
  }

  return json({ success: true, message: `Tài khoản ${record.email} đã bị từ chối.` }, 200, cors);
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

      // Public agent types
      if (url.pathname === "/agents" && request.method === "GET") {
        return handleGetAgentTypes(env, cors);
      }

      // User routes (JWT required)
      if (url.pathname === "/user/profile" && request.method === "GET") {
        return handleUserProfile(request, env, cors);
      }
      if (url.pathname === "/user/agents" && request.method === "GET") {
        return handleUserAgents(request, env, cors);
      }
      if (url.pathname === "/user/agents/request" && request.method === "POST") {
        return handleUserRequestAgent(request, env, cors);
      }

      // Admin — agent requests
      if (url.pathname === "/admin/agent-requests" && request.method === "GET") {
        return handleAdminAgentRequests(request, env, cors);
      }
      const agentReqMatch = url.pathname.match(/^\/admin\/agent-requests\/([^/]+)\/(approve|reject)$/);
      if (agentReqMatch && request.method === "POST") {
        const [, id, action] = agentReqMatch;
        if (action === "approve") return handleAdminApproveAgent(id, request, env, cors);
        if (action === "reject")  return handleAdminRejectAgent(id, request, env, cors);
      }

      // Admin routes
      if (url.pathname === "/admin/enterprises" && request.method === "GET") {
        return handleAdminList(request, env, cors);
      }
      const adminMatch = url.pathname.match(/^\/admin\/enterprises\/([^/]+)\/(approve|reject)$/);
      if (adminMatch && request.method === "POST") {
        const [, id, action] = adminMatch;
        if (action === "approve") return handleAdminApprove(id, request, env, cors);
        if (action === "reject")  return handleAdminReject(id, request, env, cors);
      }

      return json({ error: "Not found" }, 404, cors);
    } catch (err) {
      console.error("Unhandled error:", err);
      return json({ success: false, error: "Lỗi hệ thống. Vui lòng thử lại sau." }, 500, cors);
    }
  },
};
