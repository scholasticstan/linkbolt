import { describe, expect, it } from 'vitest';
import { validateDestination, referrerHost, MAX_URL_LENGTH } from '@/lib/url';

describe('validateDestination', () => {
  it('normalises a bare domain to https', () => {
    expect(validateDestination('example.com/path?q=1')).toEqual({ ok: true, url: 'https://example.com/path?q=1' });
  });
  it('keeps http when given explicitly', () => {
    expect(validateDestination('http://example.com')).toEqual({ ok: true, url: 'http://example.com/' });
  });
  it('rejects non-http schemes', () => {
    expect(validateDestination('javascript:alert(1)').ok).toBe(false);
    expect(validateDestination('ftp://example.com').ok).toBe(false);
    expect(validateDestination('data:text/html,hi').ok).toBe(false);
  });
  it('rejects private and loopback hosts', () => {
    for (const u of ['http://localhost:3000', 'http://127.0.0.1', 'http://10.0.0.5', 'http://192.168.1.1', 'http://172.16.0.1', 'http://169.254.169.254/latest']) {
      expect(validateDestination(u).ok).toBe(false);
    }
  });
  it('rejects links back to the app itself', () => {
    expect(validateDestination('https://lnk.example/abc', 'https://lnk.example').ok).toBe(false);
    expect(validateDestination('https://other.example/abc', 'https://lnk.example').ok).toBe(true);
  });
  it('rejects embedded credentials and over-long URLs', () => {
    expect(validateDestination('https://user:pw@example.com').ok).toBe(false);
    expect(validateDestination('https://example.com/' + 'a'.repeat(MAX_URL_LENGTH)).ok).toBe(false);
  });
  it('rejects empty and garbage input', () => {
    expect(validateDestination('   ').ok).toBe(false);
    expect(validateDestination('not a url').ok).toBe(false);
  });
});

describe('referrerHost', () => {
  it('strips www and returns the hostname', () => {
    expect(referrerHost('https://www.twitter.com/x/status/1')).toBe('twitter.com');
  });
  it('returns null for missing or invalid values', () => {
    expect(referrerHost(null)).toBeNull();
    expect(referrerHost('garbage')).toBeNull();
  });
});
