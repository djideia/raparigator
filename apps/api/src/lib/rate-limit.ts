export type RateLimitRule = {
  windowMs: number;
  max: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export interface RateLimiter {
  hit(key: string, rule: RateLimitRule, now?: number): RateLimitDecision;
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, number[]>();
  private lastSweep = 0;

  hit(key: string, rule: RateLimitRule, now = Date.now()): RateLimitDecision {
    this.sweep(now, rule.windowMs);
    const windowStart = now - rule.windowMs;
    const hits = (this.buckets.get(key) ?? []).filter((at) => at > windowStart);
    if (hits.length >= rule.max) {
      const oldest = hits[0] ?? now;
      this.buckets.set(key, hits);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldest + rule.windowMs - now),
      };
    }
    hits.push(now);
    this.buckets.set(key, hits);
    return { allowed: true, remaining: rule.max - hits.length, retryAfterMs: 0 };
  }

  private sweep(now: number, windowMs: number) {
    if (now - this.lastSweep < Math.max(windowMs, 60_000)) {
      return;
    }
    this.lastSweep = now;
    for (const [key, hits] of this.buckets) {
      const alive = hits.filter((at) => at > now - windowMs);
      if (alive.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, alive);
      }
    }
  }
}

export class NoopRateLimiter implements RateLimiter {
  hit(): RateLimitDecision {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfterMs: 0 };
  }
}

export const RATE_LIMITS = {
  auth: { windowMs: 60_000, max: 10 },
  chatSend: { windowMs: 60_000, max: 40 },
  report: { windowMs: 60 * 60_000, max: 5 },
  verificationSend: { windowMs: 10 * 60_000, max: 3 },
  verificationConfirm: { windowMs: 10 * 60_000, max: 6 },
  review: { windowMs: 60 * 60_000, max: 10 },
} satisfies Record<string, RateLimitRule>;
