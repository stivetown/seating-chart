import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory rate limiter for development
class InMemoryRateLimit {
  private requests: Map<string, { count: number; resetTime: number }> =
    new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const key = identifier;
    const current = this.requests.get(key);

    if (!current || now > current.resetTime) {
      // First request or window expired
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      };
    }

    if (current.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: current.resetTime,
      };
    }

    // Increment count
    current.count++;
    this.requests.set(key, current);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - current.count,
      reset: current.resetTime,
    };
  }
}

// Initialize rate limiter based on environment
let rateLimiter: Ratelimit | InMemoryRateLimit;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  // Production: Use Upstash Redis
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
  });
} else {
  // Development: Use in-memory rate limiter
  console.log('Using in-memory rate limiter (development mode)');
  rateLimiter = new InMemoryRateLimit(60, 60 * 1000); // 60 requests per minute
}

export { rateLimiter };

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

// Helper function to check rate limit
export async function checkRateLimit(request: Request): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const clientIP = getClientIP(request);
  return await rateLimiter.limit(clientIP);
}
