import { createHash, randomBytes } from 'node:crypto';

export const API_KEY_PREFIX = 'lb_';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Returns the plaintext key (shown once) plus what we persist. */
export function generateApiKey(): { key: string; prefix: string; keyHash: string } {
  const key = API_KEY_PREFIX + randomBytes(24).toString('base64url');
  return { key, prefix: key.slice(0, 8), keyHash: hashApiKey(key) };
}

export function extractBearer(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(authorization);
  return m ? m[1] : null;
}
