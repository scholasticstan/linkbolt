import { customAlphabet } from 'nanoid';

// Base62 without lookalikes (0/O, 1/l/I). 7 chars gives ~2.8e12 combinations.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const generate = customAlphabet(ALPHABET, 7);

/** Paths that must never be claimable as a slug because the app uses them. */
export const RESERVED_SLUGS = new Set([
  'api', 'dashboard', 'login', 'register', 'logout', 'settings', 'stats', 'qr',
  'docs', 'about', 'pricing', 'terms', 'privacy', 'admin', 'static', '_next',
  'favicon.ico', 'robots.txt', 'sitemap.xml', 'health', 'new', 'links',
]);

export const SLUG_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]{1,30}[a-zA-Z0-9])?$/;

export function generateSlug(): string {
  return generate();
}

export type SlugCheck = { ok: true; slug: string } | { ok: false; reason: string };

/** Validate a user-supplied slug. Returns the normalised slug on success. */
export function validateCustomSlug(input: string): SlugCheck {
  const slug = input.trim();
  if (slug.length < 3 || slug.length > 32) {
    return { ok: false, reason: 'Slug must be between 3 and 32 characters.' };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, reason: 'Use letters, numbers, dashes and underscores only.' };
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return { ok: false, reason: 'That slug is reserved.' };
  }
  return { ok: true, slug };
}
