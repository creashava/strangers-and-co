// ============================================================
// Application constants for Strangers & Co (Taranga)
// ============================================================

export const EVENT_NAME = process.env.NEXT_PUBLIC_EVENT_NAME || 'Strangers & Co';
export const EVENT_ORGANIZER = 'Taranga';
export const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE || 'September 20, 2026';
export const EVENT_TIME = process.env.NEXT_PUBLIC_EVENT_TIME || '2:00 PM – 5:00 PM';
export const EVENT_VENUE = process.env.NEXT_PUBLIC_EVENT_VENUE || 'Avinya Cafe, Mysore';
export const EVENT_TAGLINE = 'fun & laugh & games';
export const EVENT_MOTTO = 'MEET. MINGLE. MAKE FRIENDS.';
export const EVENT_PROMPT = 'Ready to meet strangers?';

export const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfHMwtGC-uE8JCgPeaBEEyP311sdgrEBHWxl7QoSEqkHYm-Ug/viewform?usp=header';

export const TIER_CONFIG = {
  early_bird: {
    label: 'Festival Offer',
    price: 99,
    originalPrice: 149,
    maxSlots: 10,
    badge: 'Festival Offer',
    description: 'Grab your tickets now before prices go up! Limited time special.',
    theme: {
      bg: 'bg-[#FDF4FF]',
      border: 'border-[#D946EF]',
      badgeBg: 'bg-[#A21CAF] text-white',
      accentColor: '#A21CAF',
      btnBg: 'bg-gradient-to-r from-[#A21CAF] to-[#D946EF] text-white hover:shadow-purple-200',
    },
  },
  regular: {
    label: 'General Pass',
    price: 149,
    originalPrice: null,
    maxSlots: 40,
    badge: 'General',
    description: 'Upgrade your experience with full event privileges. Includes priority entry line access and a complementary event resource kit.',
    theme: {
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#86EFAC]',
      badgeBg: 'bg-[#15803D] text-white',
      accentColor: '#166534',
      btnBg: 'bg-gradient-to-r from-[#166534] to-[#15803D] text-white hover:shadow-emerald-200',
    },
  },
} as const;

export const RESERVATION_TIMEOUT_MINUTES = 7;
export const RESERVATION_TIMEOUT_SECONDS = RESERVATION_TIMEOUT_MINUTES * 60;

export const TOTAL_CAPACITY = 40;
export const EARLY_BIRD_CAPACITY = 10;

export const UTR_REGEX = /^[0-9]{12}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || '7411198298-2@ibl';
export const PAYEE_NAME = process.env.NEXT_PUBLIC_PAYEE_NAME || 'DIVYA';

export function buildUpiUri(amount: number, reservationId?: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: amount.toString(),
    cu: 'INR',
    mode: '02',
    purpose: '00',
  });
  return `upi://pay?${params.toString()}`;
}
