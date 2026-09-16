/**
 * Sliding-window rate limiter kept in process memory.
 *
 * Good enough for a single instance and for tests. On a multi-instance
 * deployment each instance keeps its own counters, so real limits are
 * `max * instances`. Swap the store for Redis/Upstash when that matters;
 * the interface is deliberately tiny so that swap is a one-file change.
 */
export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

type Bucket = number[]; // timestamps (ms) of recent hits

const store = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  // Every few minutes drop keys that have gone quiet so the map can't grow forever.
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  for (const [key, hits] of store) {
    if (hits.length === 0 || hits[hits.length - 1] < now - windowMs) store.delete(key);
  }
}

export function rateLimit(
  key: string,
  { max, windowMs, now = Date.now() }: { max: number; windowMs: number; now?: number },
): RateLimitResult {
  sweep(now, windowMs);
  const since = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > since);
  if (hits.length >= max) {
    return { allowed: false, remaining: 0, resetAt: hits[0] + windowMs };
  }
  hits.push(now);
  store.set(key, hits);
  return { allowed: true, remaining: max - hits.length, resetAt: hits[0] + windowMs };
}

/** Test helper. */
export function resetRateLimits() {
  store.clear();
}
