import { createHash } from 'node:crypto';
import { isbot } from 'isbot';
import { UAParser } from 'ua-parser-js';
import { referrerHost } from './url';

export type ClickInfo = {
  referrerHost: string | null;
  country: string | null;
  device: string;
  browser: string | null;
  os: string | null;
  bot: boolean;
  visitorHash: string | null;
};

/** Minimal shape so this can be unit-tested without a real Request. */
export type HeaderSource = { get(name: string): string | null };

export function clientIp(headers: HeaderSource): string | null {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip');
}

export function dailyVisitorHash(ip: string | null, ua: string | null, salt: string, date = new Date()): string | null {
  if (!ip && !ua) return null;
  const day = date.toISOString().slice(0, 10);
  return createHash('sha256').update(`${salt}|${day}|${ip ?? ''}|${ua ?? ''}`).digest('hex').slice(0, 32);
}

export function parseClick(headers: HeaderSource, salt = process.env.VISITOR_SALT ?? ''): ClickInfo {
  const ua = headers.get('user-agent');
  const parsed = new UAParser(ua ?? '').getResult();
  const deviceType = parsed.device.type; // mobile | tablet | undefined for desktop, etc.
  return {
    referrerHost: referrerHost(headers.get('referer')),
    // Vercel and Cloudflare both expose a two-letter country code header.
    country: headers.get('x-vercel-ip-country') ?? headers.get('cf-ipcountry') ?? null,
    device: deviceType === 'mobile' || deviceType === 'tablet' ? deviceType : 'desktop',
    // 'Mobile Chrome' and 'Chrome' are the same product for our purposes.
    browser: parsed.browser.name?.replace(/^Mobile /, '') ?? null,
    os: parsed.os.name ?? null,
    bot: ua ? isbot(ua) : true,
    visitorHash: dailyVisitorHash(clientIp(headers), ua, salt),
  };
}
