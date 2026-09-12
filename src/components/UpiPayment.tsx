'use client';

import { QRCodeSVG } from 'qrcode.react';
import { TIER_CONFIG, UPI_ID, PAYEE_NAME, buildUpiUri } from '@/lib/constants';
import type { TicketTier } from '@/lib/types';
import { Copy, Check, Info, Smartphone, QrCode } from 'lucide-react';
import { useState } from 'react';

interface UpiPaymentProps {
  tier: TicketTier;
  amount: number;
  reservationId: string;
}

export default function UpiPayment({ tier, amount, reservationId }: UpiPaymentProps) {
  const [copied, setCopied] = useState(false);
  const config = TIER_CONFIG[tier];
  const isEarlyBird = tier === 'early_bird';
  const upiUri = buildUpiUri(amount, reservationId);

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
            isEarlyBird ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
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

      {/* Dynamic Amount-Locked QR Code Container */}
      <div className="relative rounded-3xl bg-white p-5 border-2 border-stone-200 shadow-sm flex flex-col items-center">
        {/* Fixed Amount Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 mb-3.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Amount Locked: ₹{amount}</span>
        </div>

        {/* QR Code */}
        <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-center">
          <QRCodeSVG
            value={upiUri}
            size={220}
            level="M"
            includeMargin={false}
            className="w-full h-auto max-w-[210px]"
          />
        </div>

        <div className="mt-3.5 text-center">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full mb-1">
            <QrCode size={11} className="text-stone-500" />
            <span>Scan to Pay Exactly ₹{amount}</span>
          </div>
          <p className="text-xs text-stone-600 font-semibold mt-0.5">
            Works with Google Pay, PhonePe, Paytm, BHIM &amp; Cred
          </p>
        </div>
      </div>

      {/* Direct UPI App Trigger for Mobile Devices */}
      <div className="mt-3.5">
        <a
          href={upiUri}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-extrabold text-xs tracking-wide shadow-md shadow-emerald-900/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Smartphone size={16} />
          <span>Tap to Pay ₹{amount} Directly in UPI App</span>
        </a>
      </div>

      {/* UPI ID Quick Copy */}
      <div className="mt-3">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              UPI ID (DIVYA)
            </p>
            <p className="text-xs font-mono font-bold text-stone-800">{UPI_ID}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyUpiId}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
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

      {/* Instructions */}
      <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-[11px] text-amber-900">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Instructions:</p>
            <p className="mt-0.5 text-stone-600">
              Pay ₹{amount} using the QR code or the direct button above. Take a screenshot of the completed payment receipt, then tap <strong>Next</strong> below to enter your details and upload it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

