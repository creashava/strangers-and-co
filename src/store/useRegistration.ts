'use client';

import { create } from 'zustand';
import type { TicketTier, SlotCounts, ReservationResult } from '@/lib/types';

interface RegistrationState {
  // Slot data
  slotCounts: SlotCounts | null;
  isLoadingSlots: boolean;

  // Reservation
  reservationId: string | null;
  selectedTier: TicketTier | null;
  amount: number | null;
  expiresAt: Date | null;
  isReserving: boolean;

  // Form submission
  isSubmitting: boolean;
  isComplete: boolean;

  // Toast
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';

  // Actions
  setSlotCounts: (counts: SlotCounts) => void;
  setLoadingSlots: (loading: boolean) => void;
  setReservation: (result: ReservationResult, expiresAt: Date) => void;
  clearReservation: () => void;
  setSubmitting: (submitting: boolean) => void;
  setComplete: (complete: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  reset: () => void;
}

const initialState = {
  slotCounts: null,
  isLoadingSlots: false,
  reservationId: null,
  selectedTier: null,
  amount: null,
  expiresAt: null,
  isReserving: false,
  isSubmitting: false,
  isComplete: false,
  toastMessage: null,
  toastType: 'info' as const,
};

export const useRegistrationStore = create<RegistrationState>((set) => ({
  ...initialState,

  setSlotCounts: (counts) => set({ slotCounts: counts, isLoadingSlots: false }),
  setLoadingSlots: (loading) => set({ isLoadingSlots: loading }),

  setReservation: (result, expiresAt) =>
    set({
      reservationId: result.reservation_id,
      selectedTier: result.tier_assigned,
      amount: result.amount,
      expiresAt,
      isReserving: false,
    }),

  clearReservation: () =>
    set({
      reservationId: null,
      selectedTier: null,
      amount: null,
      expiresAt: null,
      isReserving: false,
    }),

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setComplete: (complete) => set({ isComplete: complete }),

  showToast: (message, type = 'info') => set({ toastMessage: message, toastType: type }),
  hideToast: () => set({ toastMessage: null }),

  reset: () => set(initialState),
}));
