import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { and, eq, gt, sql } from 'drizzle-orm';
import { cache } from 'react';
import { db, schema } from '@/db';
import type { User } from '@/db/schema';

const COOKIE = 'lb_session';
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export { hashPassword, verifyPassword } from './password';
export { findUserByEmail } from './users';

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  }
  jar.delete(COOKIE);
}

/** The signed-in user for this request, or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, sql`now()`)))
    .limit(1);
  return rows[0]?.user ?? null;
});

