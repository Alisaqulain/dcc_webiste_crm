'use client';

import CrmAnimatedAmount from './CrmAnimatedAmount';

const cards = [
  { key: 'today', label: "Today's Earning", delay: 0 },
  { key: 'last7', label: 'Last 7 Days Earning', delay: 120 },
  { key: 'last30', label: 'Last 30 Days Earning', delay: 240 },
  { key: 'allTime', label: 'All Time Earning', delay: 360 },
];

export default function CrmEarningCards({ data, animate = true }) {
  const values = {
    today: data?.todayEarning ?? 0,
    last7: data?.last7DaysEarning ?? 0,
    last30: data?.last30DaysEarning ?? 0,
    allTime: data?.allTimeEarning ?? 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={c.key}
          className="crm-earn-card rounded-2xl p-5 border border-violet-200/60 shadow-sm"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <p className="text-sm font-medium text-violet-900/80 mb-2">{c.label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-violet-950 tabular-nums">
            ₹{' '}
            {animate ? (
              <CrmAnimatedAmount
                value={values[c.key]}
                delay={c.delay}
                duration={1200 + i * 200}
                playSound={values[c.key] > 0}
              />
            ) : (
              Math.round(values[c.key]).toLocaleString('en-IN')
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
