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
  const [activeTab, setActiveTab] = useState<'phonepe' | 'qr'>('phonepe');
  const upiUri = buildUpiUri(amount, reservationId);
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

      {/* Payment Mode Selector Tabs */}
      <div className="flex rounded-2xl bg-stone-100 p-1 mb-4 border border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('phonepe')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'phonepe'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          PhonePe Official QR
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'qr'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Universal QR
        </button>
      </div>

      {/* QR Container */}
      <div className="relative rounded-3xl bg-white p-5 border-2 border-stone-200 shadow-sm flex flex-col items-center">
        {activeTab === 'phonepe' ? (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-[240px] rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-white">
              <img
                src="/phonepe-qr.jpg"
                alt="PhonePe QR for DIVYA"
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="text-[11px] text-stone-500 font-semibold mt-3 text-center">
              Scan with PhonePe, Google Pay, or Paytm
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-xs">
              <QRCodeSVG
                value={upiUri}
                size={200}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#1C1917"
              />
            </div>
            <p className="text-[11px] text-stone-500 font-semibold mt-3 text-center">
              Scan to send ₹{amount} to {PAYEE_NAME}
            </p>
          </div>
        )}
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

      {/* 1-Tap Mobile Intent Link */}
      <div className="mt-3">
        <a
          href={upiUri}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-sm transition-all active:scale-[0.98] ${
            isEarlyBird
              ? 'bg-[#EA580C] hover:bg-[#C2410C] shadow-orange-200'
              : 'bg-[#15803D] hover:bg-[#166534] shadow-emerald-200'
          }`}
        >
          <Smartphone size={17} />
          <span>Pay via UPI App (₹{amount})</span>
        </a>
      </div>

      {/* Helper notice */}
      <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-[11px] text-amber-900">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Instructions:</p>
            <p className="mt-0.5 text-stone-600">
              Scan the QR code above or tap the button to pay ₹{amount}. After paying, tap the <strong>Enter UTR &amp; Details</strong> button below to confirm your ticket.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
