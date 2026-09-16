export const MAX_URL_LENGTH = 2048;

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[::1\]|::1)/i;
const PRIVATE_172 = /^172\.(1[6-9]|2\d|3[01])\./;

export type UrlCheck = { ok: true; url: string } | { ok: false; reason: string };

/**
 * Validate and normalise a destination URL.
 * Only http(s), no private/loopback hosts, no pointing back at ourselves
 * (which would make a redirect loop), and a sane length cap.
 */
export function validateDestination(input: string, selfOrigin?: string): UrlCheck {
  const raw = input.trim();
  if (!raw) return { ok: false, reason: 'Enter a URL.' };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, reason: `URL is longer than ${MAX_URL_LENGTH} characters.` };

  // Be forgiving about a missing scheme: "example.com/path" becomes https://
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: 'That does not look like a valid URL.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https links are allowed.' };
  }
  const host = parsed.hostname;
  if (!host.includes('.') && host !== 'localhost') {
    return { ok: false, reason: 'The hostname is missing a domain.' };
  }
  if (PRIVATE_HOST.test(host) || PRIVATE_172.test(host)) {
    return { ok: false, reason: 'Links to private or local addresses are not allowed.' };
  }
  if (selfOrigin) {
    try {
      if (new URL(selfOrigin).host === parsed.host) {
        return { ok: false, reason: 'You cannot shorten a link to this site.' };
      }
    } catch {
      /* ignore a malformed selfOrigin */
    }
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'Credentials in URLs are not allowed.' };
  }
  return { ok: true, url: parsed.toString() };
}

/** Hostname of a referrer for grouping, or null when absent/unparseable. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}
