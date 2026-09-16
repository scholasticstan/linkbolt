import { describe, expect, it } from 'vitest';
import { parseClick, clientIp, dailyVisitorHash } from '@/lib/clicks';

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });

const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const SAFARI_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

describe('parseClick', () => {
  it('classifies a phone browser', () => {
    const c = parseClick(h({ 'user-agent': CHROME_ANDROID, referer: 'https://t.co/abc', 'x-vercel-ip-country': 'NG' }), 's');
    expect(c).toMatchObject({ device: 'mobile', browser: 'Chrome', os: 'Android', country: 'NG', referrerHost: 't.co', bot: false });
  });
  it('classifies a desktop browser with no referrer', () => {
    const c = parseClick(h({ 'user-agent': SAFARI_MAC }), 's');
    expect(c).toMatchObject({ device: 'desktop', browser: 'Safari', os: 'macOS', referrerHost: null, country: null, bot: false });
  });
  it('flags crawlers and missing user agents as bots', () => {
    expect(parseClick(h({ 'user-agent': 'Twitterbot/1.0' }), 's').bot).toBe(true);
    expect(parseClick(h({ 'user-agent': 'Slackbot-LinkExpanding 1.0' }), 's').bot).toBe(true);
    expect(parseClick(h({}), 's').bot).toBe(true);
  });
});

describe('clientIp', () => {
  it('takes the first forwarded address', () => {
    expect(clientIp(h({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
    expect(clientIp(h({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8');
    expect(clientIp(h({}))).toBeNull();
  });
});

describe('dailyVisitorHash', () => {
  it('is stable within a day and changes across days and salts', () => {
    const d1 = new Date('2026-01-01T10:00:00Z');
    const d2 = new Date('2026-01-02T10:00:00Z');
    const a = dailyVisitorHash('1.1.1.1', 'ua', 'salt', d1);
    expect(dailyVisitorHash('1.1.1.1', 'ua', 'salt', new Date('2026-01-01T23:00:00Z'))).toBe(a);
    expect(dailyVisitorHash('1.1.1.1', 'ua', 'salt', d2)).not.toBe(a);
    expect(dailyVisitorHash('1.1.1.1', 'ua', 'other', d1)).not.toBe(a);
    expect(a).toHaveLength(32);
  });
  it('returns null with nothing to hash', () => {
    expect(dailyVisitorHash(null, null, 'salt')).toBeNull();
  });
});
