'use client';

import { useEffect, useState } from 'react';

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diff(target: number): Parts {
  const total = Math.max(0, target - Date.now());
  return {
    days: Math.floor(total / 86400000),
    hours: Math.floor((total / 3600000) % 24),
    minutes: Math.floor((total / 60000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

export function Countdown({ date }: { date: string }) {
  const target = new Date(`${date}T00:00:00`).getTime();
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    setParts(diff(target));
    const id = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) return null;

  const units: { key: keyof Parts; label: string }[] = [
    { key: 'days', label: 'Days' },
    { key: 'hours', label: 'Hours' },
    { key: 'minutes', label: 'Minutes' },
    { key: 'seconds', label: 'Seconds' },
  ];

  return (
    <div className="flex justify-center gap-4 sm:gap-8" aria-live="off">
      {units.map(({ key, label }) => (
        <div key={key} className="text-center">
          <div className="font-display text-3xl font-semibold tabular-nums sm:text-5xl">
            {parts ? String(parts[key]).padStart(2, '0') : '--'}
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest opacity-70">{label}</div>
        </div>
      ))}
    </div>
  );
}