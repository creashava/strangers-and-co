'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TierCard from '@/components/TierCard';
import { useRegistrationStore } from '@/store/useRegistration';
import type { TicketTier, SlotCounts, ReservationResult } from '@/lib/types';
import {
  EVENT_NAME,
  EVENT_ORGANIZER,
  EVENT_DATE,
  EVENT_TIME,
  EVENT_VENUE,
  EVENT_TAGLINE,
  EVENT_MOTTO,
  EVENT_PROMPT,
} from '@/lib/constants';
import {
  Clock,
  Calendar,
  MapPin,
  Smile,
  Coffee,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Dice5,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { slotCounts, setSlotCounts, setLoadingSlots, showToast } = useRegistrationStore();
  const [reservingTier, setReservingTier] = useState<TicketTier | null>(null);

  // Fetch slot status
  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/slots');
      if (res.ok) {
        const data: SlotCounts = await res.json();
        setSlotCounts(data);
      }
    } catch {
      // Silently retry on next poll
    }
  }, [setSlotCounts]);

  useEffect(() => {
    setLoadingSlots(true);
    fetchSlots();

    // Poll every 6 seconds
    const interval = setInterval(fetchSlots, 6000);
    return () => clearInterval(interval);
  }, [fetchSlots, setLoadingSlots]);

  // Handle tier selection → reserve slot
  const handleSelectTier = async (tier: TicketTier) => {
    setReservingTier(tier);

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const result: ReservationResult = await res.json();

      if (result.success && result.reservation_id) {
        const params = new URLSearchParams({
          id: result.reservation_id,
          tier: result.tier_assigned || tier,
          amount: String(result.amount || (tier === 'early_bird' ? 199 : 230)),
        });
        router.push(`/register?${params.toString()}`);
      } else {
        showToast(result.message || 'Slot currently unavailable.', 'error');
        fetchSlots();
      }
    } catch {
      showToast('Network issue. Please try again.', 'error');
    } finally {
      setReservingTier(null);
    }
  };

  // Availability flags — NO SEAT COUNTS DISPLAYED to the user!
  const isEarlyBirdAvailable = (slotCounts?.early_bird_taken ?? 0) < 10;
  const isRegularAvailable = (slotCounts?.total_taken ?? 0) < 40;

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1C1917] selection:bg-[#FED7AA] selection:text-[#7C2D12]">
      {/* Subtle warm paper texture & organic background accents */}
      <div className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-16">
          {/* Taranga Brand Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[#166534]">
                {EVENT_ORGANIZER}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
            </div>

            {/* Poster Tagline */}
            <div className="mb-2">
              <span className="inline-block text-sm sm:text-base font-semibold text-[#0369A1] tracking-wide font-serif italic">
                ~ {EVENT_TAGLINE} ~
              </span>
            </div>

            {/* Main Title - Inspired directly by the poster */}
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none text-[#0F382C] mb-3">
              STRANGERS{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] to-[#F97316] font-serif italic font-extrabold">
                &amp; CO
              </span>
            </h1>

            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#1E1B4B] text-white text-xs sm:text-sm font-bold tracking-[0.2em] shadow-sm mb-6 uppercase">
              {EVENT_MOTTO}
            </div>

            <p className="text-base sm:text-lg text-[#57534E] max-w-xl mx-auto font-normal leading-relaxed">
              Step out of your comfort zone, play fun games, and meet awesome people in Mysore.
              No awkward small talk — just authentic vibes and laughter.
            </p>
          </header>

          {/* Event Quick Info Banner (Matching the Poster Layout) */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 shadow-sm mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80">
              {/* Time */}
              <div className="flex items-center gap-3.5 sm:justify-center pt-2 sm:pt-0">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                    Time
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-stone-800">
                    {EVENT_TIME}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3.5 sm:justify-center pt-4 sm:pt-0 sm:pl-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                    Date
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-stone-800">
                    {EVENT_DATE}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3.5 sm:justify-center pt-4 sm:pt-0 sm:pl-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                    Location
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-stone-800">
                    {EVENT_VENUE}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
              {EVENT_PROMPT}
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Select your pass below to lock your slot for 7 minutes.
            </p>
          </div>

          {/* Ticket Selection Cards (No seat counts, pure availability status) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <TierCard
              tier="early_bird"
              isAvailable={isEarlyBirdAvailable}
              onSelect={handleSelectTier}
              isLoading={reservingTier === 'early_bird'}
              disabled={reservingTier !== null}
            />
            <TierCard
              tier="regular"
              isAvailable={isRegularAvailable}
              onSelect={handleSelectTier}
              isLoading={reservingTier === 'regular'}
              disabled={reservingTier !== null}
            />
          </div>

          {/* Experience Highlights */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <span className="text-xs uppercase font-bold tracking-widest text-[#15803D]">
                What to expect
              </span>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">
                An Afternoon Designed for Fun &amp; Connection
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
                  <Dice5 size={20} />
                </div>
                <h4 className="text-sm font-bold text-stone-800 mb-1">Icebreakers &amp; Games</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Interactive games curated to break the ice naturally without any awkwardness.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <Coffee size={20} />
                </div>
                <h4 className="text-sm font-bold text-stone-800 mb-1">Avinya Cafe Ambience</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Cozy aesthetic seating, refreshing cafe drinks &amp; a relaxed Mysore afternoon.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <Smile size={20} />
                </div>
                <h4 className="text-sm font-bold text-stone-800 mb-1">Solo Friendly</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Coming alone? Perfect! Most attendees do. You&apos;ll feel at home within 5 minutes.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-sm font-bold text-stone-800 mb-1">Guaranteed Entry</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Instant atomic reservation lock + digital verified pass with QR code.
                </p>
              </div>
            </div>
          </div>

          {/* Simple How-It-Works */}
          <div className="bg-[#FAF4EB] rounded-3xl p-6 sm:p-8 border border-stone-200/80 mb-16">
            <h3 className="text-base font-black text-stone-800 uppercase tracking-wider text-center mb-6">
              How Registration Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#1E1B4B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-800">Select Pass</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Choose Early Bird or General Admission. Your spot is locked for 7 minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#1E1B4B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-800">Scan &amp; Pay</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Use any UPI app (GPay, PhonePe, Paytm) to pay the exact amount.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#1E1B4B] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-800">Get Digital Pass</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Enter your 12-digit UPI UTR number and download your verified entry pass.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ section */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-stone-900 flex items-center justify-center gap-2">
                <HelpCircle size={18} className="text-[#15803D]" />
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80">
                <p className="font-bold text-xs text-stone-800">Can I attend by myself?</p>
                <p className="text-xs text-stone-500 mt-1">
                  Yes, 100%! Over 80% of our attendees come solo. The event is intentionally designed so everyone mingles effortlessly.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200/80">
                <p className="font-bold text-xs text-stone-800">What happens after I pay via UPI?</p>
                <p className="text-xs text-stone-500 mt-1">
                  You enter your 12-digit UPI UTR number from your payment app. Your reservation is immediately verified and you receive a digital ticket with a verification QR code.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200/80">
                <p className="font-bold text-xs text-stone-800">Where is Avinya Cafe located in Mysore?</p>
                <p className="text-xs text-stone-500 mt-1">
                  Avinya Cafe is located in Mysore. Detailed Google Maps directions will be on your confirmed pass!
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center pt-8 border-t border-stone-200/80">
            <p className="text-xs font-bold text-stone-600">
              Strangers &amp; Co • Organised by Taranga
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              Sunday, September 20, 2026 • 2:00 PM – 5:00 PM • Avinya Cafe, Mysore
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
