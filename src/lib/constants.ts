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

export const TIER_CONFIG = {
  early_bird: {
    label: 'Early Bird Pass',
    price: 199,
    maxSlots: 10,
    badge: 'Special Offer',
    description: 'Grab the discounted early bird pass before it is claimed.',
    theme: {
      bg: 'bg-[#FFF7ED]',
      border: 'border-[#FB923C]',
      badgeBg: 'bg-[#F97316] text-white',
      accentColor: '#EA580C',
      btnBg: 'bg-gradient-to-r from-[#EA580C] to-[#F97316] text-white hover:shadow-orange-200',
    },
  },
  regular: {
    label: 'General Admission',
    price: 249,
    maxSlots: 40,
    badge: 'Standard Pass',
    description: 'Full pass to 3 hours of curated games, conversations & laughs.',
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

export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi';
export const PAYEE_NAME = process.env.NEXT_PUBLIC_PAYEE_NAME || 'Taranga - Strangers & Co';

export function buildUpiUri(amount: number, reservationId: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: amount.toString(),
    cu: 'INR',
    tn: `STRANGERS_CO_${reservationId.slice(0, 8).toUpperCase()}`,
  });
  return `upi://pay?${params.toString()}`;
}
