'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CountdownTimer from '@/components/CountdownTimer';
import UpiPayment from '@/components/UpiPayment';
import RegistrationForm from '@/components/RegistrationForm';
import { useRegistrationStore } from '@/store/useRegistration';
import { RESERVATION_TIMEOUT_SECONDS, TIER_CONFIG, EVENT_NAME } from '@/lib/constants';
import type { TicketTier, RegistrationFormData, CompleteRegistrationResult } from '@/lib/types';
import { ArrowLeft, ArrowRight, ShieldCheck, Clock, Check } from 'lucide-react';

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast, isSubmitting, setSubmitting } = useRegistrationStore();

  const reservationId = searchParams.get('id');
  const tier = searchParams.get('tier') as TicketTier | null;
  const amount = Number(searchParams.get('amount') || 0);

  const [expiresAt] = useState(() => {
    return new Date(Date.now() + RESERVATION_TIMEOUT_SECONDS * 1000);
  });
  const [isExpired, setIsExpired] = useState(false);
  const [step, setStep] = useState<'payment' | 'form'>('payment');

  useEffect(() => {
    if (!reservationId || !tier || !amount) {
      router.replace('/');
    }
  }, [reservationId, tier, amount, router]);

  const handleExpire = useCallback(() => {
    setIsExpired(true);
    showToast('Your reservation lock has expired. Please select a pass again.', 'error');
    setTimeout(() => router.replace('/'), 3000);
  }, [router, showToast]);

  const handleFormSubmit = useCallback(
    async (data: RegistrationFormData) => {
      if (!reservationId) return;
      setSubmitting(true);

      try {
        const formData = new FormData();
        formData.append('reservation_id', reservationId);
        formData.append('full_name', data.full_name);
        formData.append('email', data.email);
        formData.append('phone', data.phone);
        formData.append('utr_number', data.utr_number);
        formData.append('screenshot', data.screenshot);

        const res = await fetch('/api/register', {
          method: 'POST',
          body: formData,
        });

        const result: CompleteRegistrationResult = await res.json();

        if (result.success) {
          showToast('Registration Confirmed! Here is your ticket.', 'success');
          const params = new URLSearchParams({
            name: data.full_name,
            tier: tier || 'regular',
            amount: String(amount),
          });
          router.push(`/ticket/${reservationId}?${params.toString()}`);
        } else {
          showToast(result.message || 'Registration failed. Please verify your UTR.', 'error');
        }
      } catch {
        showToast('Network error. Please try again.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [reservationId, tier, amount, router, showToast, setSubmitting]
  );

  if (!reservationId || !tier || !amount) {
    return null;
  }

  const config = TIER_CONFIG[tier];
  const isEarlyBird = tier === 'early_bird';

  if (isExpired) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-600 mb-4">
            <Clock size={26} />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-1">Reservation Window Closed</h2>
          <p className="text-stone-500 text-xs mb-6">
            The 7-minute lock on this slot has timed out to give other guests a chance.
          </p>
          <button
            onClick={() => router.replace('/')}
            className="w-full py-3 rounded-2xl bg-[#15803D] text-white text-xs font-bold hover:bg-[#166534] transition-all"
          >
            ← Pick a Pass
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1C1917] selection:bg-[#FED7AA] selection:text-[#7C2D12]">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Back button */}
        <button
          onClick={() => router.replace('/')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to passes
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-stone-200 text-stone-700 mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Slot Reserved for You</span>
          </div>

          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Complete Registration
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {EVENT_NAME} • {config.label} (₹{amount})
          </p>
        </div>

        {/* Circular Countdown Timer */}
        <div className="flex justify-center mb-6">
          <CountdownTimer expiresAt={expiresAt} onExpire={handleExpire} />
        </div>

        {/* Two-step progress bar */}
        <div className="grid grid-cols-2 gap-2 bg-stone-200/60 p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => setStep('payment')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              step === 'payment'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>Scan &amp; Pay</span>
          </button>
          <button
            onClick={() => setStep('form')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              step === 'form'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
              2
            </span>
            <span>Enter UTR &amp; Details</span>
          </button>
        </div>

        {/* Form / Payment Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          {step === 'payment' ? (
            <div>
              <UpiPayment tier={tier} amount={amount} reservationId={reservationId} />
              <div className="mt-6 pt-5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full py-4 px-6 rounded-2xl bg-stone-900 hover:bg-black text-white font-extrabold text-base tracking-wide shadow-lg shadow-stone-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                >
                  <span>Enter UTR &amp; Details</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 text-emerald-400" />
                </button>
                <p className="text-xs text-stone-500 text-center mt-2.5 font-medium">
                  Already completed payment? Tap the button above to enter your UTR number
                </p>
              </div>
            </div>
          ) : (
            <div>
              <RegistrationForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
              <div className="mt-4 pt-3 border-t border-stone-100 text-center">
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
                >
                  &larr; Need to see the UPI QR code again?
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-stone-400 text-xs">
          <ShieldCheck size={14} className="text-[#15803D]" />
          <span>Atomic slot lock active • Ref: REG_{reservationId.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="text-stone-500 text-sm font-medium">Loading reservation...</div>
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
