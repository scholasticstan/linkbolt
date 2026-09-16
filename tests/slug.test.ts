import { describe, expect, it } from 'vitest';
import { generateSlug, validateCustomSlug, RESERVED_SLUGS, SLUG_PATTERN } from '@/lib/slug';

describe('generateSlug', () => {
  it('produces 7-char slugs from the safe alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const s = generateSlug();
      expect(s).toHaveLength(7);
      expect(s).toMatch(/^[23456789a-hj-km-np-zA-HJ-NP-Z]+$/);
      expect(SLUG_PATTERN.test(s)).toBe(true);
    }
  });
  it('does not repeat in a small sample', () => {
    const set = new Set(Array.from({ length: 2000 }, generateSlug));
    expect(set.size).toBe(2000);
  });
});

describe('validateCustomSlug', () => {
  it('accepts sane slugs and trims whitespace', () => {
    expect(validateCustomSlug('  my-link_1 ')).toEqual({ ok: true, slug: 'my-link_1' });
  });
  it('rejects short, long, and badly formed slugs', () => {
    expect(validateCustomSlug('ab').ok).toBe(false);
    expect(validateCustomSlug('a'.repeat(33)).ok).toBe(false);
    expect(validateCustomSlug('-leading').ok).toBe(false);
    expect(validateCustomSlug('has space').ok).toBe(false);
    expect(validateCustomSlug('dots.not.ok').ok).toBe(false);
  });
  it('rejects reserved app paths regardless of case', () => {
    for (const r of ['api', 'Dashboard', 'LOGIN']) expect(validateCustomSlug(r).ok).toBe(false);
    expect(RESERVED_SLUGS.has('api')).toBe(true);
  });
});
