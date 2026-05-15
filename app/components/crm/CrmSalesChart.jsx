'use client';

import { useMemo, useState, useEffect } from 'react';

const RANGES = [
  { id: 'ALL', label: 'ALL', days: null },
  { id: '1W', label: '1W', days: 7 },
  { id: '1M', label: '1M', days: 30 },
  { id: '6M', label: '6M', days: 180 },
  { id: '1Y', label: '1Y', days: 365 },
];

function filterSeries(series, days) {
  if (!days || !series?.length) return series || [];
  const cut = new Date();
  cut.setDate(cut.getDate() - days);
  const cutKey = cut.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= cutKey);
}

export default function CrmSalesChart({ salesSeries = [] }) {
  const [range, setRange] = useState('1Y');
  const [drawProgress, setDrawProgress] = useState(0);

  const filtered = useMemo(() => {
    const cfg = RANGES.find((r) => r.id === range) || RANGES[4];
    return filterSeries(salesSeries, cfg.days);
  }, [salesSeries, range]);

  const { pathD, areaD, maxY, points } = useMemo(() => {
    const w = 800;
    const h = 220;
    const pad = { t: 16, r: 16, b: 28, l: 48 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    if (!filtered.length) {
      return { pathD: '', areaD: '', maxY: 100, points: [] };
    }

    const maxVal = Math.max(120, ...filtered.map((p) => p.amount), 1);
    const pts = filtered.map((p, i) => {
      const x = pad.l + (i / Math.max(1, filtered.length - 1)) * innerW;
      const y = pad.t + innerH - (p.amount / maxVal) * innerH;
      return { x, y, ...p };
    });

    const line = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    const area =
      line +
      ` L ${pts[pts.length - 1].x.toFixed(1)} ${pad.t + innerH}` +
      ` L ${pts[0].x.toFixed(1)} ${pad.t + innerH} Z`;

    return { pathD: line, areaD: area, maxY: maxVal, points: pts };
  }, [filtered]);

  useEffect(() => {
    setDrawProgress(0);
    const start = performance.now();
    const dur = 1200;
    let raf;
    const step = (ts) => {
      const p = Math.min(1, (ts - start) / dur);
      setDrawProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [range, pathD]);

  const pathLen = 1200;
  const dashOffset = pathLen * (1 - drawProgress);

  return (
    <div className="crm-chart-card rounded-2xl border border-violet-200/50 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-violet-950">Sales Details</h3>
        <div className="flex flex-wrap gap-1 bg-violet-50 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                range === r.id
                  ? 'bg-violet-700 text-white shadow'
                  : 'text-violet-700 hover:bg-violet-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-violet-50/80 to-white">
        <svg
          viewBox="0 0 800 220"
          className="w-full h-[220px] sm:h-[260px]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="crmAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={48}
              y1={16 + (220 - 44) * t}
              x2={784}
              y2={16 + (220 - 44) * t}
              stroke="#e9d5ff"
              strokeWidth="1"
            />
          ))}
          {[0, 0.5, 1].map((t) => (
            <text
              key={`y-${t}`}
              x={40}
              y={20 + (220 - 44) * t}
              textAnchor="end"
              className="fill-violet-400 text-[10px]"
            >
              {Math.round(maxY * (1 - t))}
            </text>
          ))}
          {areaD && (
            <path
              d={areaD}
              fill="url(#crmAreaGrad)"
              style={{
                opacity: drawProgress,
                transform: `scaleY(${drawProgress})`,
                transformOrigin: 'bottom',
              }}
            />
          )}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#6d28d9"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              strokeDashoffset={dashOffset}
            />
          )}
          {points.map((p, i) => (
            <circle
              key={p.date}
              cx={p.x}
              cy={p.y}
              r={drawProgress > i / points.length ? 4 : 0}
              fill="#6d28d9"
              className="transition-all duration-300"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
