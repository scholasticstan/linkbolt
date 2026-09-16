'use client';
import { useActionState } from 'react';
import { updateLinkAction, type EditFormState } from '@/app/actions/links';
import { Button, ErrorText, Input, Label } from './ui';

type Props = { id: string; slug: string; url: string; title: string | null; expiresAt: string | null; publicStats: boolean };

export function EditLinkForm(link: Props) {
  const [state, action, pending] = useActionState<EditFormState, FormData>(updateLinkAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={link.id} />
      <input type="hidden" name="slug" value={link.slug} />
      <div>
        <Label htmlFor="url">Destination URL</Label>
        <Input id="url" name="url" defaultValue={link.url} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={link.title ?? ''} maxLength={120} />
        </div>
        <div>
          <Label htmlFor="expiresAt">Expires</Label>
          <Input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={link.expiresAt ?? ''} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="publicStats" defaultChecked={link.publicStats} className="accent-accent" />
        Make the stats page public at <span className="font-mono text-ink">/{link.slug}/stats</span>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} variant="ghost">{pending ? 'Saving…' : 'Save changes'}</Button>
        <ErrorText>{state?.error}</ErrorText>
        {state?.saved && <span className="text-sm text-accent-2">Saved.</span>}
      </div>
    </form>
  );
}
