'use client';

import { TIER_CONFIG } from '@/lib/constants';
import type { TicketTier } from '@/lib/types';
import { Sparkles, Check, Ticket, ArrowRight, ShieldCheck, Star, Crown } from 'lucide-react';

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
  const isFestival = tier === 'early_bird';
  const isDisabled = disabled || !isAvailable || isLoading;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 border-2 ${
        isFestival
          ? 'bg-[#FDF4FF] border-[#E879F9] hover:border-[#A21CAF] shadow-sm hover:shadow-xl hover:shadow-purple-100'
          : 'bg-[#F9FAF7] border-[#86EFAC] hover:border-[#15803D] shadow-sm hover:shadow-xl hover:shadow-emerald-100'
      } ${!isAvailable ? 'opacity-60 grayscale-[40%] cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}`}
      onClick={() => !isDisabled && onSelect(tier)}
    >
      {/* Limited Time Ribbon for Festival Offer */}
      {isFestival && isAvailable && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#A21CAF] to-[#D946EF] text-white shadow-lg shadow-purple-500/25 animate-pulse">
            <Star size={12} className="fill-amber-300 text-amber-300" />
            Limited Time
            <Star size={12} className="fill-amber-300 text-amber-300" />
          </span>
        </div>
      )}

      {/* Top Tag & Status */}
      <div>
        <div className={`flex items-center justify-between gap-3 ${isFestival ? 'mt-3' : ''} mb-5`}>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              isFestival
                ? 'bg-[#F5D0FE] text-[#86198F]'
                : 'bg-[#DCFCE7] text-[#166534]'
            }`}
          >
            {isFestival ? <Ticket size={13} className="text-[#A21CAF]" /> : <Crown size={13} className="text-[#15803D]" />}
            {config.badge}
          </span>

          {/* Availability Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isAvailable
                ? isFestival
                  ? 'bg-purple-100/80 text-purple-900'
                  : 'bg-emerald-100/80 text-emerald-900'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAvailable
                  ? isFestival
                    ? 'bg-[#A21CAF] animate-pulse'
                    : 'bg-[#16A34A] animate-pulse'
                  : 'bg-stone-400'
              }`}
            />
            {isAvailable ? 'Offer Active' : 'Sold Out'}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-2xl font-extrabold text-[#1C1917] tracking-tight mb-2">
          {isFestival ? '🎟️ ' : '🎟️ '}{config.label}
        </h3>
        <p className="text-sm text-[#78716C] leading-relaxed mb-5 font-normal">
          {config.description}
        </p>

        {/* Price Tag */}
        <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-stone-200/80">
          {isFestival ? (
            <>
              <span className="text-lg font-bold text-stone-400 line-through decoration-rose-500/70 mr-1">
                ₹{config.originalPrice}
              </span>
              <span className="text-lg font-bold text-stone-400">₹</span>
              <span className="text-5xl font-black text-[#0F172A] tracking-tight">
                {config.price}
              </span>
              <span className="text-xs font-medium text-stone-500 ml-1 uppercase tracking-wider">
                / person
              </span>
              <span className="ml-auto text-xs font-bold text-[#A21CAF] bg-purple-100/80 px-2.5 py-1 rounded-lg">
                Save ₹{(config.originalPrice ?? 0) - config.price}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-stone-400">₹</span>
              <span className="text-5xl font-black text-[#0F172A] tracking-tight">
                {config.price}
              </span>
              <span className="text-xs font-medium text-stone-500 ml-1 uppercase tracking-wider">
                / person
              </span>
              <span className="ml-auto text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                Exclusive Value
              </span>
            </>
          )}
        </div>

        {/* Value Highlights */}
        <ul className="space-y-3 mb-8 text-sm text-[#44403C]">
          {isFestival ? (
            <>
              <li className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Fun & interactive icebreaker games</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Full 3-hour experience at Avinya Cafe</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Meet & connect with friendly new people</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>Everything in Festival Offer</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles size={12} strokeWidth={3} />
                </span>
                <span className="font-semibold">Priority entry & line access</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sparkles size={12} strokeWidth={3} />
                </span>
                <span className="font-semibold">Complementary event resource kit</span>
              </li>
            </>
          )}
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
              : isFestival
              ? 'bg-gradient-to-r from-[#A21CAF] to-[#D946EF] hover:from-[#86198F] hover:to-[#C026D3] text-white hover:shadow-md hover:shadow-purple-500/20 active:scale-[0.98]'
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
              <span>
                {isFestival
                  ? `Book Festival Pass (₹${config.price})`
                  : `Book General Pass (₹${config.price})`}
              </span>
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
