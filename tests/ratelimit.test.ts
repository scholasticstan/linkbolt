import { beforeEach, describe, expect, it } from 'vitest';
import { rateLimit, resetRateLimits } from '@/lib/ratelimit';

describe('rateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('allows up to max hits inside the window then blocks', () => {
    const opts = { max: 3, windowMs: 1000, now: 1_000_000 };
    expect(rateLimit('k', opts)).toMatchObject({ allowed: true, remaining: 2 });
    expect(rateLimit('k', opts)).toMatchObject({ allowed: true, remaining: 1 });
    expect(rateLimit('k', opts)).toMatchObject({ allowed: true, remaining: 0 });
    const blocked = rateLimit('k', opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.resetAt).toBe(1_001_000);
  });

  it('slides: old hits fall out of the window', () => {
    rateLimit('k', { max: 2, windowMs: 1000, now: 0 });
    rateLimit('k', { max: 2, windowMs: 1000, now: 500 });
    expect(rateLimit('k', { max: 2, windowMs: 1000, now: 900 }).allowed).toBe(false);
    expect(rateLimit('k', { max: 2, windowMs: 1000, now: 1001 }).allowed).toBe(true);
  });

  it('keys are independent', () => {
    rateLimit('a', { max: 1, windowMs: 1000, now: 0 });
    expect(rateLimit('a', { max: 1, windowMs: 1000, now: 1 }).allowed).toBe(false);
    expect(rateLimit('b', { max: 1, windowMs: 1000, now: 1 }).allowed).toBe(true);
  });
});
