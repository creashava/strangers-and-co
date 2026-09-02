'use client';

import { TIER_CONFIG } from '@/lib/constants';
import type { TicketTier } from '@/lib/types';
import { Sparkles, Check, Flame, ArrowRight, ShieldCheck } from 'lucide-react';

interface TierCardProps {
  tier: TicketTier;
  isAvailable: boolean;
  onSelect: (tier: TicketTier) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function TierCard({
  tier,
  isAvailable,
  onSelect,
  disabled = false,
  isLoading = false,
}: TierCardProps) {
  const config = TIER_CONFIG[tier];
  const isEarlyBird = tier === 'early_bird';
  const isDisabled = disabled || !isAvailable || isLoading;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 border-2 ${
        isEarlyBird
          ? 'bg-[#FFFBF5] border-[#FDBA74] hover:border-[#EA580C] shadow-sm hover:shadow-xl hover:shadow-orange-100'
          : 'bg-[#F9FAF7] border-[#86EFAC] hover:border-[#15803D] shadow-sm hover:shadow-xl hover:shadow-emerald-100'
      } ${!isAvailable ? 'opacity-60 grayscale-[40%] cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
      onClick={() => !isDisabled && onSelect(tier)}
    >
      {/* Top Tag & Status */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              isEarlyBird
                ? 'bg-[#FFEDD5] text-[#C2410C]'
                : 'bg-[#DCFCE7] text-[#166534]'
            }`}
          >
            {isEarlyBird ? <Flame size={13} className="text-[#EA580C]" /> : <Sparkles size={13} className="text-[#15803D]" />}
            {config.badge}
          </span>

          {/* Availability Status Badge - NO NUMBERS, just Available vs Sold Out */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isAvailable
                ? isEarlyBird
                  ? 'bg-amber-100/80 text-amber-900'
                  : 'bg-emerald-100/80 text-emerald-900'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAvailable
                  ? isEarlyBird
                    ? 'bg-[#EA580C] animate-pulse'
                    : 'bg-[#16A34A] animate-pulse'
                  : 'bg-stone-400'
              }`}
            />
            {isAvailable ? (isEarlyBird ? 'Offer Active' : 'Open') : 'Sold Out'}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-2xl font-extrabold text-[#1C1917] tracking-tight mb-2">
          {config.label}
        </h3>
        <p className="text-sm text-[#78716C] leading-relaxed mb-6 font-normal">
          {config.description}
        </p>

        {/* Price Tag */}
        <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-stone-200/80">
          <span className="text-lg font-bold text-stone-400">₹</span>
          <span className="text-5xl font-black text-[#0F172A] tracking-tight">
            {config.price}
          </span>
          <span className="text-xs font-medium text-stone-500 ml-1 uppercase tracking-wider">
            / person
          </span>
          {isEarlyBird && (
            <span className="ml-auto text-xs font-bold text-[#EA580C] bg-orange-100/80 px-2.5 py-1 rounded-lg">
              Save ₹50
            </span>
          )}
        </div>

        {/* Value Highlights */}
        <ul className="space-y-3 mb-8 text-sm text-[#44403C]">
          <li className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>Fun & interactive icebreaker games</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>Full 3-hour experience at Avinya Cafe</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>Meet & connect with friendly new people</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck size={13} className="text-emerald-700" />
            </span>
            <span>Guaranteed 7-minute atomic lock on payment</span>
          </li>
        </ul>
      </div>

      {/* Action Button */}
      <div>
        <button
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) onSelect(tier);
          }}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
            !isAvailable
              ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
              : isEarlyBird
              ? 'bg-[#EA580C] hover:bg-[#C2410C] text-white hover:shadow-md hover:shadow-orange-500/20 active:scale-[0.98]'
              : 'bg-[#15803D] hover:bg-[#166534] text-white hover:shadow-md hover:shadow-emerald-600/20 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Locking Your Slot...
            </span>
          ) : !isAvailable ? (
            'Sold Out'
          ) : (
            <>
              <span>Book {isEarlyBird ? 'Early Bird (₹199)' : 'General Pass (₹249)'}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-stone-400 mt-2 font-medium">
          Instant UPI verification • 100% Secure
        </p>
      </div>
    </div>
  );
}
