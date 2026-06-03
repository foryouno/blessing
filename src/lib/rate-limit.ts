import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs } = config;

  return function rateLimiter(request: NextRequest): NextResponse | null {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const now = Date.now();
    const record = rateLimitStore[ip];

    if (!record || now > record.resetTime) {
      rateLimitStore[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return null;
    }

    record.count++;

    if (record.count > maxRequests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: `Too many requests, please retry after ${Math.ceil((record.resetTime - now) / 1000)} seconds`,
          },
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)) } }
      );
    }

    return null;
  };
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, record] of Object.entries(rateLimitStore)) {
    if (now > record.resetTime) {
      delete rateLimitStore[ip];
    }
  }
}

if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
