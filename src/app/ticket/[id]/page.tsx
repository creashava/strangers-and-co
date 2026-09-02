'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import DigitalTicket from '@/components/DigitalTicket';
import type { TicketTier } from '@/lib/types';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function TicketContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingId = params.id as string;
  const name = searchParams.get('name') || 'Attendee';
  const tier = (searchParams.get('tier') as TicketTier) || 'regular';
  const amount = Number(searchParams.get('amount') || 230);

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1C1917] selection:bg-[#FED7AA] selection:text-[#7C2D12]">
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-16">
        {/* Celebration header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 mb-3 shadow-2xs">
            <Sparkles size={26} />
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            See You There! 🎉
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            Your registration is confirmed. Please save or screenshot your digital ticket below.
          </p>
        </div>

        {/* Digital Ticket */}
        <DigitalTicket
          name={name}
          tier={tier}
          amount={amount}
          bookingId={bookingId}
        />

        {/* Back link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Strangers &amp; Co home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="text-stone-500 text-sm font-medium">Preparing your pass...</div>
        </main>
      }
    >
      <TicketContent />
    </Suspense>
  );
}
