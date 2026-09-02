// ============================================================
// TypeScript interfaces for the Early-Bird Payment System
// ============================================================

export type TicketTier = 'early_bird' | 'regular';
export type RegistrationStatus = 'reserved' | 'verified' | 'rejected' | 'expired';

export interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  tier: TicketTier;
  amount_paid: number;
  utr_number: string | null;
  screenshot_url: string | null;
  status: RegistrationStatus;
  reserved_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationResult {
  success: boolean;
  reservation_id: string | null;
  slots_left: number;
  tier_assigned: TicketTier | null;
  amount: number | null;
  message: string;
}

export interface SlotCounts {
  early_bird_taken: number;
  early_bird_total: number;
  regular_taken: number;
  total_taken: number;
  total_capacity: number;
}

export interface RegistrationFormData {
  full_name: string;
  email: string;
  phone: string;
  utr_number: string;
  screenshot?: File | null;
}

export interface CompleteRegistrationResult {
  success: boolean;
  message: string;
}
