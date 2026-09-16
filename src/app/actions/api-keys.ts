'use server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, schema } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-keys';

export type KeyFormState = { error?: string; key?: string } | undefined;

export async function createKeyAction(_prev: KeyFormState, formData: FormData): Promise<KeyFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const name = String(formData.get('name') ?? '').trim().slice(0, 60) || 'Default';
  const existing = await db.select({ id: schema.apiKeys.id }).from(schema.apiKeys).where(eq(schema.apiKeys.userId, user.id));
  if (existing.length >= 10) return { error: 'You can have at most 10 API keys.' };
  const { key, prefix, keyHash } = generateApiKey();
  await db.insert(schema.apiKeys).values({ userId: user.id, name, prefix, keyHash });
  revalidatePath('/dashboard/settings');
  return { key };
}

export async function revokeKeyAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await db.delete(schema.apiKeys).where(and(eq(schema.apiKeys.id, String(formData.get('id') ?? '')), eq(schema.apiKeys.userId, user.id)));
  revalidatePath('/dashboard/settings');
}
