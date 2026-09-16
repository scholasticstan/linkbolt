/**
 * Tiny LRU with per-entry TTL. Used on the redirect path so a hot link
 * does not hit Postgres on every click.
 */
export class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>();

  constructor(private readonly maxEntries = 5000, private readonly ttlMs = 60_000) {}

  get(key: string, now = Date.now()): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expires <= now) {
      this.map.delete(key);
      return undefined;
    }
    // refresh recency
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V, now = Date.now()) {
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: now + this.ttlMs });
  }

  delete(key: string) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  get size() {
    return this.map.size;
  }
}
