'use client';

import { TIER_CONFIG, UPI_ID, PAYEE_NAME } from '@/lib/constants';
import type { TicketTier } from '@/lib/types';
import { Copy, Check, Info } from 'lucide-react';
import { useState } from 'react';

interface UpiPaymentProps {
  tier: TicketTier;
  amount: number;
  reservationId: string;
}

export default function UpiPayment({ tier, amount }: UpiPaymentProps) {
  const [copied, setCopied] = useState(false);
  const config = TIER_CONFIG[tier];
  const isEarlyBird = tier === 'early_bird';

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Amount Header */}
      <div className="text-center mb-5">
        <span
          className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 ${
            isEarlyBird ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {config.label}
        </span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl font-bold text-stone-400">₹</span>
          <span className="text-5xl font-black text-stone-900 tracking-tight">
            {amount}
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-1 font-medium">
          Payee: <strong className="text-stone-800">{PAYEE_NAME}</strong>
        </p>
      </div>

      {/* Single All-in-One QR Code Container */}
      <div className="relative rounded-3xl bg-white p-5 border-2 border-stone-200 shadow-sm flex flex-col items-center">
        <div className="w-full max-w-[240px] rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-white">
          <img
            src="/phonepe-qr.jpg"
            alt={`UPI QR for ${PAYEE_NAME}`}
            className="w-full h-auto object-contain"
          />
        </div>
        <div className="mt-3 text-center">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mb-1">
            Universal UPI QR
          </span>
          <p className="text-xs text-stone-600 font-semibold">
            Scan with any UPI app (Google Pay, PhonePe, Paytm, CRED)
          </p>
        </div>
      </div>

      {/* UPI ID Quick Copy */}
      <div className="mt-4">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              UPI ID
            </p>
            <p className="text-xs font-mono font-bold text-stone-800">{UPI_ID}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyUpiId}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helper notice */}
      <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-[11px] text-amber-900">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Instructions:</p>
            <p className="mt-0.5 text-stone-600">
              Scan the QR code above or copy the UPI ID to pay ₹{amount}. After paying, tap the <strong>Next</strong> button below to fill your details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
