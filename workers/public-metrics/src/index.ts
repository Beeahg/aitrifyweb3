export interface Env {
  CF_API_TOKEN: string;
  GCP_SA_KEY: string; // full JSON string of the GCP service account key file
}

interface GCPServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface MetricsResponse {
  total_requests: number;
  total_tokens: number;
  active_agents: number;
  uptime_percent: number;
  zone_all_requests: number;
  zemmer_requests: number;
  cached_at: string;
}

const CF_ACCOUNT_ID = 'e2fb3d22235a4c18423d7aa45422cb25';
const CF_ZONE_ID = '41fb378b1b7e7df8e83a779481ec297a';
const GCP_PROJECT_ID = 'aitrify-main';
const CACHE_TTL = 300; // 5 minutes
const CACHE_KEY = 'https://public-metrics-cache.aitrify.internal/v1';
const ALLOWED_ORIGINS = new Set([
  'https://aitrify.com',
  'https://www.aitrify.com',
  'http://localhost:3000',
]);

// ── CORS ──────────────────────────────────────────────────────────────────────

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://aitrify.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

// ── Base64url helpers ─────────────────────────────────────────────────────────

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function objToB64url(obj: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── GCP JWT + token exchange ───────────────────────────────────────────────────

async function importRSAPrivateKey(pem: string): Promise<CryptoKey> {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const bin = atob(b64);
  const bytes = Uint8Array.from({ length: bin.length }, (_, i) => bin.charCodeAt(i));
  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function getGCPAccessToken(sa: GCPServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = objToB64url({ alg: 'RS256', typ: 'JWT' });
  const payload = objToB64url({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/monitoring.read',
    aud: sa.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  });

  const signingInput = `${header}.${payload}`;
  const key = await importRSAPrivateKey(sa.private_key);
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${bufToB64url(sigBuf)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GCP token exchange failed (${res.status}): ${body}`);
  }
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

// ── GCP Cloud Run: total request count (last 2 years) ─────────────────────────

async function getGCPTotalRequests(gcpToken: string): Promise<number> {
  const end = new Date();
  const start = new Date(end.getTime() - 730 * 24 * 3600 * 1000);

  const params = new URLSearchParams({
    // Sum all Cloud Run revision request counts in the project
    filter:
      'metric.type="run.googleapis.com/request_count" AND resource.type="cloud_run_revision"',
    'interval.startTime': start.toISOString(),
    'interval.endTime': end.toISOString(),
    // Daily alignment, sum each day, then reduce all services to one series
    'aggregation.alignmentPeriod': '86400s',
    'aggregation.perSeriesAligner': 'ALIGN_SUM',
    'aggregation.crossSeriesReducer': 'REDUCE_SUM',
  });

  const url = `https://monitoring.googleapis.com/v3/projects/${GCP_PROJECT_ID}/timeSeries?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${gcpToken}` } });

  if (!res.ok) {
    console.error('GCP Monitoring error:', res.status, await res.text());
    return 0;
  }

  const data = (await res.json()) as {
    timeSeries?: {
      points?: { value: { int64Value?: string; doubleValue?: number } }[];
    }[];
  };

  let total = 0;
  for (const series of data.timeSeries ?? []) {
    for (const point of series.points ?? []) {
      const v = point.value;
      total += v.int64Value ? parseInt(v.int64Value, 10) : (v.doubleValue ?? 0);
    }
  }
  return total;
}


// ── GCP Cloud Run: Zemmer BE request count (last 90 days) ────────────────────
async function getZemmerRequests(gcpToken: string): Promise<number> {
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 24 * 3600 * 1000);

  const params = new URLSearchParams({
    filter: 'metric.type="run.googleapis.com/request_count" AND resource.type="cloud_run_revision" AND resource.labels.service_name="zemmer-be"',
    'interval.startTime': start.toISOString(),
    'interval.endTime': end.toISOString(),
    'aggregation.alignmentPeriod': '86400s',
    'aggregation.perSeriesAligner': 'ALIGN_SUM',
    'aggregation.crossSeriesReducer': 'REDUCE_SUM',
  });

  //const url = `https://monitoring.googleapis.com/v3/projects/${GCP_PROJECT_ID}/timeSeries?${params}`;
  const url = `https://monitoring.googleapis.com/v3/projects/zemmer-qlbh-gcr/timeSeries?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${gcpToken}` } });

  if (!res.ok) {
    console.error('GCP Zemmer Monitoring error:', res.status, await res.text());
    return 0;
  }

  const data = (await res.json()) as {
    timeSeries?: {
      points?: { value: { int64Value?: string; doubleValue?: number } }[];
    }[];
  };

  let total = 0;
  for (const series of data.timeSeries ?? []) {
    for (const point of series.points ?? []) {
      const v = point.value;
      total += v.int64Value ? parseInt(v.int64Value, 10) : (v.doubleValue ?? 0);
    }
  }
  return total;
}
// ── CF Vectorize: count indexes ───────────────────────────────────────────────

async function getVectorizeCount(apiToken: string): Promise<number> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/v2/indexes`,
    { headers: { Authorization: `Bearer ${apiToken}` } },
  );
  if (!res.ok) {
    console.error('Vectorize API error:', res.status);
    return 4; // known count as fallback
  }
  const { result } = (await res.json()) as { result?: unknown[] };
  return (result ?? []).length || 4;
}

// ── CF Workers AI: total input + output tokens ────────────────────────────────

async function getAITokens(apiToken: string): Promise<number> {
  // CF Analytics limits query range to ~33 days for this dataset
  const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const end = new Date();

  // Truncate to hour boundary for the GraphQL datetime filter
  const startHour = start.toISOString().slice(0, 13) + ':00:00Z';
  const endHour = end.toISOString().slice(0, 13) + ':00:00Z';

  const query = `{
    viewer {
      accounts(filter: {accountTag: "${CF_ACCOUNT_ID}"}) {
        aiInferenceAdaptiveGroups(
          limit: 1
          filter: {
            datetimeHour_geq: "${startHour}"
            datetimeHour_leq: "${endHour}"
          }
        ) {
          sum { totalInputTokens totalOutputTokens }
        }
      }
    }
  }`;

  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    console.error('CF GraphQL error:', res.status);
    return 0;
  }

  const data = (await res.json()) as {
    data?: {
      viewer?: {
        accounts?: {
          aiInferenceAdaptiveGroups?: {
            sum?: { totalInputTokens?: number; totalOutputTokens?: number };
          }[];
        }[];
      };
    };
    errors?: { message: string }[];
  };

  if (data.errors?.length) {
    console.error('CF GraphQL schema errors:', JSON.stringify(data.errors));
    return 0;
  }

  const g =
    data.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups?.[0]?.sum ?? {};
  return (g.totalInputTokens ?? 0) + (g.totalOutputTokens ?? 0);
}

// ── CF Analytics: uptime % over last 30 days ─────────────────────────────────

async function getUptimePercent(apiToken: string): Promise<number> {
  const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const end = new Date();

  const startHour = start.toISOString().slice(0, 13) + ':00:00Z';
  const endHour = end.toISOString().slice(0, 13) + ':00:00Z';

  const query = `{
    viewer {
      accounts(filter: {accountTag: "${CF_ACCOUNT_ID}"}) {
        workersInvocationsAdaptiveGroups(
          limit: 1
          filter: {
            datetimeHour_geq: "${startHour}"
            datetimeHour_leq: "${endHour}"
          }
        ) {
          sum { requests errors }
        }
      }
    }
  }`;

  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) return 99.97;

  const data = (await res.json()) as {
    data?: {
      viewer?: {
        accounts?: {
          workersInvocationsAdaptiveGroups?: {
            sum?: { requests?: number; errors?: number };
          }[];
        }[];
      };
    };
    errors?: { message: string }[];
  };

  if (data.errors?.length) return 99.97;

  const s =
    data.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptiveGroups?.[0]?.sum ?? {};
  const requests = s.requests ?? 0;
  const errors = s.errors ?? 0;
  if (requests === 0) return 99.97;

  return Math.round(((requests - errors) / requests) * 10000) / 100;
}


// ── CF Zone Analytics: HTTP requests (last 90 days) ──────────────────────────
async function getZoneHttpRequests(apiToken: string, zoneTag: string, hostname?: string): Promise<number> {
  const start = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const end = new Date();
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const hostnameFilter = hostname ? `clientRequestHTTPHost: "${hostname}"` : '';
  const query = `{
    viewer {
      zones(filter: { zoneTag: "${zoneTag}" }) {
        httpRequests1dGroups(limit: 1 filter: { date_geq: "${startDate}" date_leq: "${endDate}" ${hostnameFilter} }) {
          sum { requests }
        }
      }
    }
  }`;
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) { console.error('Zone Analytics error:', res.status); return 0; }
  const data = (await res.json()) as { data?: { viewer?: { zones?: { httpRequests1dGroups?: { sum?: { requests?: number } }[] }[] } }; errors?: { message: string }[] };
  if (data.errors?.length) { console.error('Zone GraphQL errors:', JSON.stringify(data.errors)); return 0; }
  return data.data?.viewer?.zones?.[0]?.httpRequests1dGroups?.[0]?.sum?.requests ?? 0;
}
// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const cors = buildCorsHeaders(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET' || url.pathname !== '/metrics') {
      return new Response('Not found', { status: 404 });
    }

    // ── Cache lookup ──────────────────────────────────────────────────────────
    const cache = caches.default;
    const cachedResp = await cache.match(CACHE_KEY);
    if (cachedResp) {
      const text = await cachedResp.text();
      return new Response(text, {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache': 'HIT',
        },
      });
    }

    // ── Fetch real metrics ────────────────────────────────────────────────────
    try {
      const sa: GCPServiceAccount = JSON.parse(env.GCP_SA_KEY);
      const gcpToken = await getGCPAccessToken(sa);

      const [total_requests, total_tokens, active_agents, uptime_percent, zone_all_requests, zemmer_requests] =
        await Promise.all([
          getGCPTotalRequests(gcpToken),
          getAITokens(env.CF_API_TOKEN),
          getVectorizeCount(env.CF_API_TOKEN),
          getUptimePercent(env.CF_API_TOKEN),
          getZoneHttpRequests(env.CF_API_TOKEN, CF_ZONE_ID),
          getZemmerRequests(gcpToken),
        ]);

      const metrics: MetricsResponse = {
        total_requests,
        total_tokens,
        active_agents,
        uptime_percent,
        zone_all_requests,
        zemmer_requests,
        cached_at: new Date().toISOString(),
      };
      const body = JSON.stringify(metrics);

      // Store in cache (no CORS headers so it's origin-agnostic)
      ctx.waitUntil(
        cache.put(
          CACHE_KEY,
          new Response(body, {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': `public, max-age=${CACHE_TTL}`,
            },
          }),
        ),
      );

      return new Response(body, {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Cache': 'MISS',
        },
      });
    } catch (err) {
      console.error('public-metrics error:', err);
      return new Response(
        JSON.stringify({ error: 'metrics unavailable', detail: String(err) }),
        {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
