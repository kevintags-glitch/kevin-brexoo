"use client";
import { useId, useMemo, useRef, useState } from "react";

export type Series = { label: string; values: number[]; color: string; fill?: boolean };

/**
 * Lightweight two-series area chart with a hover/keyboard tooltip. Dependency-free SVG; the first
 * series is the current period and gets the gradient fill.
 */
export function AreaChart({ labels, series, height = 240, format = (n: number) => String(n), ariaLabel }: { labels: string[]; series: Series[]; height?: number; format?: (n: number) => string; ariaLabel: string }) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = height;
  const pad = { l: 40, r: 12, t: 12, b: 26 };
  const max = useMemo(() => {
    const m = Math.max(1, ...series.flatMap((s) => s.values));
    const step = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / step) * step;
  }, [series]);
  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  // Smooth monotone-ish path via Catmull-Rom → Bézier.
  const path = (vals: number[]) => {
    const pts = vals.map((v, i) => [x(i), y(v)] as const);
    if (pts.length < 2) return "";
    let d = `M${pts[0]![0]},${pts[0]![1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[i + 2] ?? p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0]},${Math.min(H - pad.b, c1[1]!)} ${c2[0]},${Math.min(H - pad.b, c2[1]!)} ${p2[0]},${p2[1]}`;
    }
    return d;
  };
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));

  const onMove = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const rel = ((clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((rel - pad.l) / (W - pad.l - pad.r)) * (n - 1)))));
  };

  return (
    <div
      ref={ref}
      className="relative select-none outline-none"
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerLeave={() => setHover(null)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
        if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
      }}
      onBlur={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" preserveAspectRatio="none" style={{ height: H }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={series[0]?.color} stopOpacity="0.22" />
            <stop offset="1" stopColor={series[0]?.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t ? "3 5" : undefined} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">
              {format(t)}
            </text>
          </g>
        ))}
        {series[0] ? <path d={`${path(series[0].values)} L${x(n - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`} fill={`url(#g${id})`} /> : null}
        {series.map((s, i) => (
          <path key={s.label} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={i === 0 ? 2.25 : 1.75} strokeDasharray={i === 0 ? undefined : "0"} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={i === 0 ? 1 : 0.8} />
        ))}
        {hover !== null ? (
          <g>
            <rect x={x(hover) - 14} y={pad.t} width={28} height={H - pad.t - pad.b} fill={series[0]?.color} opacity="0.08" rx="6" />
            {series.map((s) => (
              <circle key={s.label} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r="4.5" fill="var(--surface)" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        ) : null}
        <text x={pad.l} y={H - 6} fontSize="11" fill="var(--ink-3)">
          {labels[0]}
        </text>
        <text x={W - pad.r} y={H - 6} fontSize="11" fill="var(--ink-3)" textAnchor="end">
          {labels[n - 1]}
        </text>
      </svg>
      {hover !== null ? (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-md"
          style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% + 12px), calc(100% - 170px))` }}
          aria-live="polite"
        >
          <p className="mb-1 font-medium text-ink">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.label} className="flex items-center justify-between gap-4 tabular">
              <span className="flex items-center gap-1.5 text-ink-3">
                <span className="size-2 rounded-sm" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-medium text-ink">{format(s.values[hover] ?? 0)}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
