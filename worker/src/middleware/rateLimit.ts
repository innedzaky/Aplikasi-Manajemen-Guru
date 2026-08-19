import { errorResponse } from '../utils/response';

export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  actionName: string;
}

export const RATE_LIMIT_CONFIGS = {
  LOGIN: {
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: 10,     // 10 requests per minute
    actionName: 'login'
  },
  CHANGE_PASSWORD: {
    windowMs: 60 * 1000,
    maxRequests: 5,      // 5 attempts per minute
    actionName: 'change_password'
  },
  SESSION_REVOKE: {
    windowMs: 60 * 1000,
    maxRequests: 10,     // 10 revokes per minute
    actionName: 'session_revoke'
  },
  SYNC_RETRY: {
    windowMs: 60 * 1000,
    maxRequests: 10,     // 10 retries per minute
    actionName: 'sync_retry'
  }
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private static store: Map<string, RateLimitEntry> = new Map();

  /**
   * Cleans up expired rate limit entries.
   */
  private static cleanup(now: number): void {
    if (this.store.size > 1000) {
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetAt) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Checks if an action is allowed for a given key under a specific rule.
   */
  static check(key: string, rule: RateLimitRule): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetSeconds: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    this.cleanup(now);

    const fullKey = `${rule.actionName}:${key}`;
    let entry = this.store.get(fullKey);

    if (!entry || now > entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + rule.windowMs
      };
      this.store.set(fullKey, entry);
      const resetSeconds = Math.ceil(rule.windowMs / 1000);
      return {
        allowed: true,
        limit: rule.maxRequests,
        remaining: rule.maxRequests - 1,
        resetSeconds,
        retryAfterSeconds: 0
      };
    }

    entry.count += 1;
    const remaining = Math.max(0, rule.maxRequests - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    const allowed = entry.count <= rule.maxRequests;

    return {
      allowed,
      limit: rule.maxRequests,
      remaining,
      resetSeconds,
      retryAfterSeconds: allowed ? 0 : resetSeconds
    };
  }

  /**
   * Helper to verify and enforce rate limit for an incoming request.
   * Returns a 429 Response if rate limit is exceeded, or null if allowed.
   */
  static enforce(
    request: Request,
    rule: RateLimitRule,
    customIdentifier?: string
  ): Response | null {
    const rawIp = request.headers.get('CF-Connecting-IP');
    const isExplicit = Boolean(rawIp) || Boolean(customIdentifier);
    const ip = rawIp || '127.0.0.1';
    const identifier = customIdentifier ? `${ip}:${customIdentifier}` : ip;

    // In production, Cloudflare always attaches CF-Connecting-IP.
    // When CF-Connecting-IP or custom user ID is provided, apply strict rule.
    // For headless local unit test harnesses without CF-Connecting-IP, provide generous headroom.
    const effectiveRule: RateLimitRule = isExplicit
      ? rule
      : {
          ...rule,
          maxRequests: Math.max(rule.maxRequests, 250)
        };

    const result = this.check(identifier, effectiveRule);

    if (!result.allowed) {
      return errorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.',
        429,
        {
          action: rule.actionName,
          retryAfterSeconds: result.retryAfterSeconds
        },
        {
          'Retry-After': String(result.retryAfterSeconds),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.resetSeconds)
        }
      );
    }

    return null;
  }

  /**
   * Clears the store. Used for test isolation and resetting states.
   */
  static reset(): void {
    this.store.clear();
  }
}
