import { describe, expect, it } from 'vitest';
import { TtlCache } from '@/lib/cache';

describe('TtlCache', () => {
  it('returns values until they expire', () => {
    const c = new TtlCache<string>(10, 100);
    c.set('a', 'x', 0);
    expect(c.get('a', 50)).toBe('x');
    expect(c.get('a', 100)).toBeUndefined();
  });
  it('distinguishes cached null from a miss', () => {
    const c = new TtlCache<string | null>(10, 100);
    c.set('missing', null, 0);
    expect(c.get('missing', 1)).toBeNull();
    expect(c.get('never', 1)).toBeUndefined();
  });
  it('evicts the least recently used entry when full', () => {
    const c = new TtlCache<number>(2, 1000);
    c.set('a', 1, 0);
    c.set('b', 2, 0);
    c.get('a', 1); // a is now most recent
    c.set('c', 3, 2);
    expect(c.get('b', 3)).toBeUndefined();
    expect(c.get('a', 3)).toBe(1);
    expect(c.get('c', 3)).toBe(3);
  });
});
