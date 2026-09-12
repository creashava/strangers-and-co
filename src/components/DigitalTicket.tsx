'use client';

import { QRCodeSVG } from 'qrcode.react';
import { TIER_CONFIG, EVENT_NAME, EVENT_ORGANIZER, EVENT_DATE, EVENT_TIME, EVENT_VENUE } from '@/lib/constants';
import type { TicketTier } from '@/lib/types';
import { Download, CheckCircle2, Calendar, MapPin, Clock, Sparkles } from 'lucide-react';
import { useRef, useCallback, useState } from 'react';

interface DigitalTicketProps {
  name: string;
  tier: TicketTier;
  amount: number;
  bookingId: string;
}

export default function DigitalTicket({
  name,
  tier,
  amount,
  bookingId,
}: DigitalTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const config = TIER_CONFIG[tier];
  const isEarlyBird = tier === 'early_bird';

  const handleDownload = useCallback(async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#FAF7F2',
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `strangers-co-ticket-${bookingId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download ticket:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [bookingId]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Confirmation Pill */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-700" />
          <span className="text-xs font-black uppercase tracking-wider">Spot Confirmed!</span>
        </div>
      </div>

      {/* Ticket Pass Container */}
      <div
        ref={ticketRef}
        className="relative rounded-3xl overflow-hidden border-2 border-stone-300 bg-white shadow-lg"
      >
        {/* Ticket Header */}
        <div
          className={`p-6 pb-7 text-white ${
            isEarlyBird
              ? 'bg-gradient-to-br from-[#A21CAF] to-[#86198F]'
              : 'bg-gradient-to-br from-[#15803D] to-[#0F382C]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">
                {EVENT_ORGANIZER} PRESENTS
              </p>
              <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
                {EVENT_NAME}
              </h2>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white mt-2 backdrop-blur-xs">
                {config.label}
              </span>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black text-white">₹{amount}</span>
              <p className="text-[10px] font-bold text-white/75 uppercase tracking-wider mt-0.5">
                Verified Paid
              </p>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="relative h-6 bg-white">
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#FAF7F2] border-r-2 border-stone-300" />
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-[#FAF7F2] border-l-2 border-stone-300" />
          <div className="absolute left-6 right-6 top-3 border-t-2 border-dashed border-stone-200" />
        </div>

        {/* Ticket Details Body */}
        <div className="p-6 pt-2 bg-white">
          {/* Attendee Info */}
          <div className="mb-5 pb-4 border-b border-stone-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Guest Name
            </span>
            <p className="text-lg font-black text-stone-900 tracking-tight">{name}</p>
            <p className="text-[11px] font-mono text-stone-400 mt-0.5">
              Booking Ref: <strong className="text-stone-700">REG_{bookingId.slice(0, 8).toUpperCase()}</strong>
            </p>
          </div>

          {/* Event Schedule & Venue */}
          <div className="space-y-2 mb-6 text-xs text-stone-700 font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#15803D] flex-shrink-0" />
              <span>{EVENT_DATE}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#15803D] flex-shrink-0" />
              <span>{EVENT_TIME}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-rose-600 flex-shrink-0" />
              <span>{EVENT_VENUE}</span>
            </div>
          </div>

          {/* Verification QR section */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Entry Pass Code
              </span>
              <p className="text-xs font-bold text-stone-800 mt-0.5">Scan at Venue Desk</p>
              <p className="text-[11px] text-stone-400 mt-1">Show this on arrival</p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-2xs flex-shrink-0">
              <QRCodeSVG
                value={`VERIFY:STRANGERS_CO:${bookingId}`}
                size={70}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#1C1917"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <Download size={15} />
        {isDownloading ? 'Generating Image...' : 'Save Ticket to Phone'}
      </button>

      <p className="text-center text-[11px] text-stone-400 mt-3 font-medium">
        Take a screenshot or save this pass to show at Avinya Cafe entrance.
      </p>
    </div>
  );
}
