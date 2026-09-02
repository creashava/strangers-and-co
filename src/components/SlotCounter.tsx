'use client';

import { useEffect, useState } from 'react';

interface SlotCounterProps {
  taken: number;
  total: number;
  label?: string;
  variant?: 'amber' | 'indigo';
}

export default function SlotCounter({ taken, total, label, variant = 'amber' }: SlotCounterProps) {
  const remaining = Math.max(0, total - taken);
  const percentage = (taken / total) * 100;
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const isFull = remaining === 0;
  const isLow = remaining <= 3 && remaining > 0;

  const barColors = variant === 'amber'
    ? 'from-amber-400 via-orange-500 to-red-500'
    : 'from-indigo-400 via-purple-500 to-pink-500';

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-white/50 uppercase tracking-wider font-medium">{label}</span>
          <span className={`text-xs font-bold ${
            isFull ? 'text-red-400' : isLow ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
          }`}>
            {isFull ? 'SOLD OUT' : `${remaining} left`}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barColors} transition-all duration-1000 ease-out`}
          style={{ width: `${animatedWidth}%` }}
        />
        {isLow && !isFull && (
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barColors} opacity-50 animate-pulse`}
            style={{ width: `${animatedWidth}%` }}
          />
        )}
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-white/30">{taken} / {total} filled</span>
      </div>
    </div>
  );
}
