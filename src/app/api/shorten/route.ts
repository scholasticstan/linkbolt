import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createLink } from '@/lib/links';
import { rateLimit } from '@/lib/ratelimit';
import { clientIp } from '@/lib/clicks';
import { error, handleLinkError, json, parseBody, serializeLink, isResponse } from '@/lib/api';

const ANON_TTL_DAYS = 7;
const schema = z.object({ url: z.string().min(1).max(2048) });

/** Anonymous quick-shorten from the landing page. Links expire after 7 days. */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers) ?? 'unknown';
  const rl = rateLimit(`anon:${ip}`, { max: 10, windowMs: 60 * 60_000 });
  if (!rl.allowed) return error('Too many links from this address. Sign in for higher limits.', 429);

  const body = await parseBody(req, schema);
  if (isResponse(body)) return body;

  try {
    const link = await createLink({ url: body.url, expiresAt: new Date(Date.now() + ANON_TTL_DAYS * 86_400_000) });
    return json({ ...serializeLink(link), anonymous: true }, { status: 201 });
  } catch (err) {
    return handleLinkError(err);
  }
}
