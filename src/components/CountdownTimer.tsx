'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RESERVATION_TIMEOUT_SECONDS } from '@/lib/constants';

interface CountdownTimerProps {
  expiresAt: Date;
  onExpire: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(RESERVATION_TIMEOUT_SECONDS);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const target = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((target - now) / 1000));
  }, [expiresAt]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / RESERVATION_TIMEOUT_SECONDS) * 100;

  const isUrgent = timeLeft <= 90;
  const isCritical = timeLeft <= 30;

  // SVG circle parameters
  const size = 130;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const strokeColor = isCritical ? '#E11D48' : isUrgent ? '#D97706' : '#15803D';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E7E5E4"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-3xl font-mono font-black tracking-tight ${
              isCritical ? 'text-rose-600 animate-pulse' : isUrgent ? 'text-amber-700' : 'text-stone-900'
            }`}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            Lock Active
          </span>
        </div>
      </div>

      {isUrgent && (
        <p className={`text-xs font-semibold ${isCritical ? 'text-rose-600 animate-pulse' : 'text-amber-700'}`}>
          {isCritical ? '⚠️ Time running out! Submit UTR now' : '⏱️ Complete UPI transfer before lock releases'}
        </p>
      )}
    </div>
  );
}
