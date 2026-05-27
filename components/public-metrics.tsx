'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import type { ReactNode } from 'react';

// ── Worker URL ─────────────────────────────────────────────────────────────────
// Update NEXT_PUBLIC_METRICS_WORKER_URL in .env.local after deploying the worker.
const METRICS_WORKER_URL =
  process.env.NEXT_PUBLIC_METRICS_WORKER_URL ??
  'https://public-metrics.hoangn-ahg.workers.dev/metrics';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LiveMetrics {
  total_requests: number;
  total_tokens: number;
  active_agents: number;
  uptime_percent: number;
  zone_all_requests: number;
  zemmer_requests: number;
}

interface MetricItem {
  id: string;
  label: string;
  sublabel: string;
  countTo: number;
  format: (n: number) => string;
  suffix: string;
  delay: number;
  icon: ReactNode;
  accent: string;
}

// ── Mock fallback (shown when fetch fails or while loading) ───────────────────

const MOCK_DATA: LiveMetrics = {
  total_requests: 12_800_000,
  total_tokens: 48_500_000_000,
  active_agents: 247,
  uptime_percent: 99.97,
  zone_all_requests: 113080,
  zemmer_requests: 0,
};

// ── Build metric items from live (or mock) data ───────────────────────────────

const ICONS = {
  requests: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  tokens: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  agents: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  uptime: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  http: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
};

function buildMetrics(data: LiveMetrics): MetricItem[] {
  return [
    {
      id: 'requests',
      label: 'Total AI Requests',
      sublabel: 'Processed across all agents',
      countTo: data.total_requests,
      format: (n) => n.toLocaleString('en-US'),
      suffix: '',
      delay: 0,
      accent: 'from-indigo-500 to-violet-500',
      icon: ICONS.requests,
    },
    {
      id: 'tokens',
      label: 'Tokens Generated',
      sublabel: 'Total input + output tokens served',
      countTo: data.total_tokens,
      format: (n) => n.toLocaleString('en-US'),
      suffix: '',
      delay: 150,
      accent: 'from-blue-500 to-cyan-400',
      icon: ICONS.tokens,
    },
    {
      id: 'agents',
      label: 'Active Agents',
      sublabel: 'Enterprise AI agents deployed',
      countTo: data.active_agents,
      format: (n) => n.toLocaleString('en-US'),
      suffix: '',
      delay: 300,
      accent: 'from-emerald-500 to-teal-400',
      icon: ICONS.agents,
    },
    {
      id: 'uptime',
      label: 'Edge Uptime',
      sublabel: 'SLA guaranteed availability',
      countTo: Math.round(data.uptime_percent * 100),
      format: (n) => `${(n / 100).toFixed(2)}`,
      suffix: '%',
      delay: 450,
      accent: 'from-amber-400 to-orange-500',
      icon: ICONS.uptime,
    },
    {
      id: 'zemmer_requests',
      label: 'Featured Client',
      sublabel: 'Featured client requests (last 90 days)',
      countTo: data.zemmer_requests,
      format: (n) => n.toLocaleString('en-US'),
      suffix: '',
      delay: 500,
      accent: 'from-green-500 to-emerald-400',
      icon: ICONS.http,
    },
    {
      id: 'all_requests',
      label: 'Platform Traffic',
      sublabel: 'Platform traffic (last 90 days)',
      countTo: data.zone_all_requests,
      format: (n) => n.toLocaleString('en-US'),
      suffix: '',
      delay: 650,
      accent: 'from-rose-500 to-pink-400',
      icon: ICONS.http,
    },
  ];
}

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(to: number, duration: number, active: boolean): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    setValue(0);
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration, active]);

  return value;
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({
  metric,
  globalActive,
  isLoading,
}: {
  metric: MetricItem;
  globalActive: boolean;
  isLoading: boolean;
}) {
  const [active, setActive] = useState(false);
  const count = useCountUp(metric.countTo, 2000, active);

  useEffect(() => {
    if (!globalActive) return;
    const t = setTimeout(() => setActive(true), metric.delay);
    return () => clearTimeout(t);
  }, [globalActive, metric.delay]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-gray-600/60 hover:bg-gray-900/80 text-center">
      {/* Gradient top accent line */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${metric.accent} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* Icon */}
      <div className="mb-4 flex justify-center">
        <div className={`inline-flex rounded-xl bg-gradient-to-br ${metric.accent} p-2.5 text-white shadow-lg`}>
          {metric.icon}
        </div>
      </div>

      {/* Animated number or loading skeleton */}
      <div className="mb-1 flex items-center justify-center gap-0.5 min-h-[2.5rem]">
        {isLoading ? (
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-700/50" />
        ) : (
          <>
            <span className="font-nacelle text-3xl font-semibold text-white md:text-4xl">
              {metric.format(count)}
            </span>
            {metric.suffix && (
              <span className={`bg-gradient-to-r ${metric.accent} bg-clip-text text-xl font-semibold text-transparent`}>
                {metric.suffix}
              </span>
            )}
          </>
        )}
      </div>

      {/* Labels */}
      <p className="text-sm font-medium text-gray-200">{metric.label}</p>
      <p className="mt-0.5 text-xs text-gray-500">{metric.sublabel}</p>
    </div>
  );
}

// ── PublicMetrics ─────────────────────────────────────────────────────────────

export default function PublicMetrics() {
  const ref = useRef<HTMLDivElement>(null);

  // Intersection visibility (section entered viewport)
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  // Data state: null = loading, LiveMetrics = ready, false = error (use mock)
  const [liveData, setLiveData] = useState<LiveMetrics | null | false>(null);
  const isLoading = liveData === null;

  // Count-up fires only when BOTH visible AND data resolved
  const active = hasBeenVisible && liveData !== null;

  const metrics = useMemo(
    () => buildMetrics(liveData || MOCK_DATA),
    [liveData],
  );

  // Intersection observer
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch real data from worker
  useEffect(() => {
    const controller = new AbortController();

    fetch(METRICS_WORKER_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<LiveMetrics>;
      })
      .then((data) => setLiveData(data))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          console.warn('public-metrics: fetch failed, using mock data', err);
          setLiveData(false); // triggers fallback to MOCK_DATA
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div ref={ref} className="mb-10" data-aos="fade-up" data-aos-delay={300}>
      {/* Section label */}
      <p className="mb-5 text-center text-sm font-bold uppercase tracking-widest text-indigo-300" style={{textShadow:"0 0 12px rgba(129,140,248,0.8), 0 2px 4px rgba(0,0,0,0.5)"}}>
        AItrify qua những con số
      </p>

      {/* 2-col on mobile → 4-col on sm+ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.id} metric={m} globalActive={active} isLoading={isLoading} />
        ))}
      </div>
    </div>
  );
}
