'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

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

const METRICS: MetricItem[] = [
  {
    id: 'requests',
    label: 'Total AI Requests',
    sublabel: 'Processed across all agents',
    countTo: 128,
    format: (n) => `${(n / 10).toFixed(1)}M`,
    suffix: '+',
    delay: 0,
    accent: 'from-indigo-500 to-violet-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'tokens',
    label: 'Tokens Generated',
    sublabel: 'Total output tokens served',
    countTo: 485,
    format: (n) => `${(n / 10).toFixed(1)}B`,
    suffix: '+',
    delay: 150,
    accent: 'from-blue-500 to-cyan-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'agents',
    label: 'Active Agents',
    sublabel: 'Enterprise AI agents deployed',
    countTo: 247,
    format: (n) => `${n}`,
    suffix: '+',
    delay: 300,
    accent: 'from-emerald-500 to-teal-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'uptime',
    label: 'Edge Uptime',
    sublabel: 'SLA guaranteed availability',
    countTo: 9997,
    format: (n) => `${(n / 100).toFixed(2)}`,
    suffix: '%',
    delay: 450,
    accent: 'from-amber-400 to-orange-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

// Ease-out cubic count-up hook driven by requestAnimationFrame
function useCountUp(to: number, duration: number, active: boolean): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(to * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration, active]);

  return value;
}

function MetricCard({
  metric,
  globalActive,
}: {
  metric: MetricItem;
  globalActive: boolean;
}) {
  const [active, setActive] = useState(false);
  const count = useCountUp(metric.countTo, 2000, active);

  useEffect(() => {
    if (!globalActive) return;
    const t = setTimeout(() => setActive(true), metric.delay);
    return () => clearTimeout(t);
  }, [globalActive, metric.delay]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-900/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-gray-600/60 hover:bg-gray-900/80">
      {/* Gradient top accent line */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${metric.accent} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* Icon with gradient background */}
      <div
        className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${metric.accent} p-2.5 text-white shadow-lg`}
      >
        {metric.icon}
      </div>

      {/* Animated number */}
      <div className="mb-1 flex items-baseline gap-0.5">
        <span className="font-nacelle text-3xl font-semibold text-white md:text-4xl">
          {metric.format(count)}
        </span>
        <span
          className={`bg-gradient-to-r ${metric.accent} bg-clip-text text-xl font-semibold text-transparent`}
        >
          {metric.suffix}
        </span>
      </div>

      {/* Labels */}
      <p className="text-sm font-medium text-gray-200">{metric.label}</p>
      <p className="mt-0.5 text-xs text-gray-500">{metric.sublabel}</p>
    </div>
  );
}

export default function PublicMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // Trigger animation when section enters viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mb-10" data-aos="fade-up" data-aos-delay={300}>
      {/* Section label */}
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-indigo-400/80">
        AItrify in Numbers
      </p>

      {/* 2-col on mobile → 4-col on sm+ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {METRICS.map((m) => (
          <MetricCard key={m.id} metric={m} globalActive={active} />
        ))}
      </div>
    </div>
  );
}
