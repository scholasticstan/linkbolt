'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, schema } from '@/db';
import { createSession, destroySession, findUserByEmail, hashPassword, verifyPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import { clientIp } from '@/lib/clicks';

export type AuthState = { error?: string; email?: string; name?: string } | undefined;

const credentials = z.object({
  email: z.string().trim().email('Enter a valid email.').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

async function ipKey(prefix: string) {
  const ip = clientIp(await headers()) ?? 'unknown';
  return `${prefix}:${ip}`;
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const rl = rateLimit(await ipKey('register'), { max: 5, windowMs: 60 * 60_000 });
  if (!rl.allowed) return { error: 'Too many sign-ups from this address. Try later.' };

  const email = String(formData.get('email') ?? '');
  const name = String(formData.get('name') ?? '').trim().slice(0, 80) || null;
  const parsed = credentials.safeParse({ email, password: formData.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0].message, email, name: name ?? undefined };

  if (await findUserByEmail(parsed.data.email)) return { error: 'An account with that email already exists.', email, name: name ?? undefined };

  const [user] = await db
    .insert(schema.users)
    .values({ email: parsed.data.email, name, passwordHash: await hashPassword(parsed.data.password) })
    .returning();
  await createSession(user.id);
  redirect('/dashboard');
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const rl = rateLimit(await ipKey('login'), { max: 10, windowMs: 15 * 60_000 });
  if (!rl.allowed) return { error: 'Too many attempts. Wait a few minutes.' };

  const email = String(formData.get('email') ?? '');
  const parsed = credentials.safeParse({ email, password: formData.get('password') });
  if (!parsed.success) return { error: 'Wrong email or password.', email };

  const user = await findUserByEmail(parsed.data.email);
  // Always run the hash comparison so timing doesn't reveal whether the email exists.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
  if (!user || !ok) return { error: 'Wrong email or password.', email };

  await createSession(user.id);
  redirect('/dashboard');
}

export async function logout() {
  await destroySession();
  redirect('/');
}
