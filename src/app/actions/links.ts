'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createLink, deleteLink, LinkError, updateLink } from '@/lib/links';
import { shortUrl } from '@/lib/base-url';

export type LinkFormValues = { url: string; slug: string; title: string; expiresAt: string };
export type LinkFormState = { error?: string; values?: LinkFormValues; created?: { slug: string; shortUrl: string } } | undefined;

function parseExpiry(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createLinkAction(_prev: LinkFormState, formData: FormData): Promise<LinkFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const values: LinkFormValues = {
    url: String(formData.get('url') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    title: String(formData.get('title') ?? ''),
    expiresAt: String(formData.get('expiresAt') ?? ''),
  };
  try {
    const link = await createLink({
      url: values.url,
      slug: values.slug || null,
      title: values.title || null,
      expiresAt: parseExpiry(values.expiresAt),
      userId: user.id,
    });
    revalidatePath('/dashboard');
    return { created: { slug: link.slug, shortUrl: shortUrl(link.slug) } };
  } catch (err) {
    // React resets the form after an action, so hand the values back to repopulate it.
    if (err instanceof LinkError) return { error: err.message, values };
    throw err;
  }
}

export type EditFormState = { error?: string; saved?: boolean } | undefined;

export async function updateLinkAction(_prev: EditFormState, formData: FormData): Promise<EditFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  try {
    const row = await updateLink(id, user.id, {
      url: String(formData.get('url') ?? ''),
      title: String(formData.get('title') ?? '') || null,
      expiresAt: parseExpiry(formData.get('expiresAt')),
      publicStats: formData.get('publicStats') === 'on',
    });
    if (!row) return { error: 'Link not found.' };
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/${slug}`);
    return { saved: true };
  } catch (err) {
    if (err instanceof LinkError) return { error: err.message };
    throw err;
  }
}

export async function deleteLinkAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await deleteLink(String(formData.get('id') ?? ''), user.id);
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
