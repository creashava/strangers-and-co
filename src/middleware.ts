import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Simple In-Memory Rate Limiter ───
// In production, use Redis or Upstash for distributed rate limiting.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMITS: Record<string, number> = {
  '/api/reserve': 5,    // Max 5 reservation attempts per minute per IP
  '/api/register': 3,   // Max 3 registration attempts per minute per IP
  '/api/slots': 30,     // Max 30 slot checks per minute per IP (polling)
  '/api/admin': 20,     // Max 20 admin requests per minute per IP
};

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string, path: string): boolean {
  const limit = Object.entries(RATE_LIMITS).find(([prefix]) => path.startsWith(prefix));
  if (!limit) return false;

  const maxRequests = limit[1];
  const key = `${ip}:${limit[0]}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return true;
  }

  return false;
}

// Periodically clean up expired entries (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Security Headers ───
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // ─── Rate Limiting for API Routes ───
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);

    if (isRateLimited(ip, pathname)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again in a moment.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }
  }

  // ─── Block Direct Admin Page Access Bot Patterns ───
  if (pathname.startsWith('/admin')) {
    const userAgent = request.headers.get('user-agent') || '';
    const botPatterns = /bot|crawl|spider|slurp|scrapy|wget|curl/i;
    if (botPatterns.test(userAgent)) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/admin',
  ],
};
