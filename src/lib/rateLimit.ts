import { NextResponse } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory fixed-window counters. On serverless each instance keeps its own
// map, so this is a best-effort brake (slows brute force / spam), not a hard
// global limit — put a shared store (Redis/Upstash) behind it for that.
const buckets = new Map<string, Bucket>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
}

/** Returns a ready-to-return 429 response when `key` exceeded `limit`
 * requests in `windowMs`, otherwise null. Include a user id or the client
 * ip (via `rateLimitKey`) in `key`. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }
  return null;
}

export function rateLimitKey(scope: string, request: Request, extra = ''): string {
  return `${scope}:${clientIp(request)}:${extra}`;
}

/** Test helper. */
export function resetRateLimits() {
  buckets.clear();
}
