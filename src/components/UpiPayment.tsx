'use client';

import { QRCodeSVG } from 'qrcode.react';
import { buildUpiUri, TIER_CONFIG, UPI_ID, PAYEE_NAME } from '@/lib/constants';
import type { TicketTier } from '@/lib/types';
import { Smartphone, QrCode, Copy, Check, Info } from 'lucide-react';
import { useState } from 'react';

interface UpiPaymentProps {
  tier: TicketTier;
  amount: number;
  reservationId: string;
}

export default function UpiPayment({ tier, amount, reservationId }: UpiPaymentProps) {
  const [copied, setCopied] = useState(false);
  const upiUri = buildUpiUri(amount, reservationId);
  const config = TIER_CONFIG[tier];
  const isEarlyBird = tier === 'early_bird';

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API fallback
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Amount Header */}
      <div className="text-center mb-6">
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
        <p className="text-xs text-stone-500 mt-1">Exact amount pre-filled in UPI QR</p>
      </div>

      {/* QR Code Container */}
      <div className="relative rounded-3xl bg-white p-6 border-2 border-stone-200/90 shadow-sm flex flex-col items-center">
        <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-xs">
          <QRCodeSVG
            value={upiUri}
            size={210}
            level="H"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#1C1917"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold mt-4">
          <QrCode size={14} className="text-[#15803D]" />
          <span>Scan with Google Pay, PhonePe, or Paytm</span>
        </div>
      </div>

      {/* UPI ID Pill with Copy */}
      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={handleCopyUpiId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all text-xs font-medium shadow-2xs active:scale-95"
        >
          <span className="text-stone-400">UPI ID:</span>
          <span className="font-mono font-bold text-stone-800">{UPI_ID}</span>
          {copied ? (
            <Check size={14} className="text-emerald-600" />
          ) : (
            <Copy size={14} className="text-stone-400" />
          )}
        </button>
      </div>

      {/* Mobile UPI Deep Link */}
      <div className="mt-4">
        <a
          href={upiUri}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-sm transition-all active:scale-[0.98] ${
            isEarlyBird
              ? 'bg-[#EA580C] hover:bg-[#C2410C] shadow-orange-200'
              : 'bg-[#15803D] hover:bg-[#166534] shadow-emerald-200'
          }`}
        >
          <Smartphone size={18} />
          Pay via UPI App (GPay / PhonePe / Paytm)
        </a>
      </div>

      {/* Helper Tip */}
      <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
        <Info size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
        <span>
          After paying, copy the <strong>12-digit UTR / UPI Ref ID</strong> from your transaction screen to confirm your pass.
        </span>
      </div>
    </div>
  );
}
