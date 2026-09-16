import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { extractBearer, hashApiKey } from './api-keys';
import { rateLimit } from './ratelimit';
import { LinkError } from './links';
import type { Link, User } from '@/db/schema';
import { shortUrl } from './base-url';

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export type ApiContext = { user: User; keyId: string };

/** Resolve the caller from a Bearer API key. Applies a per-key rate limit. */
export async function authenticate(req: Request): Promise<ApiContext | NextResponse> {
  const key = extractBearer(req.headers.get('authorization'));
  if (!key) return error('Missing Authorization: Bearer <api key> header.', 401);

  const rows = await db
    .select({ keyId: schema.apiKeys.id, user: schema.users })
    .from(schema.apiKeys)
    .innerJoin(schema.users, eq(schema.users.id, schema.apiKeys.userId))
    .where(eq(schema.apiKeys.keyHash, hashApiKey(key)))
    .limit(1);
  const hit = rows[0];
  if (!hit) return error('Invalid API key.', 401);

  const rl = rateLimit(`key:${hit.keyId}`, { max: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return error('Rate limit exceeded.', 429, { retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) });
  }

  // Best-effort; don't make the request wait on it.
  void db.update(schema.apiKeys).set({ lastUsedAt: sql`now()` }).where(eq(schema.apiKeys.id, hit.keyId));

  return { user: hit.user, keyId: hit.keyId };
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

export const createLinkSchema = z.object({
  url: z.string().min(1).max(2048),
  slug: z.string().min(3).max(32).optional().nullable(),
  title: z.string().max(120).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  publicStats: z.boolean().optional(),
});

export const updateLinkSchema = createLinkSchema.omit({ slug: true }).partial();

export function serializeLink(link: Link) {
  return {
    id: link.id,
    slug: link.slug,
    shortUrl: shortUrl(link.slug),
    url: link.url,
    title: link.title,
    clicks: link.clickCount,
    publicStats: link.publicStats,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T | NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error('Body must be JSON.');
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return error('Invalid request body.', 400, { issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
  }
  return result.data;
}

export function handleLinkError(err: unknown) {
  if (err instanceof LinkError) return error(err.message, err.status);
  console.error(err);
  return error('Internal error.', 500);
}
