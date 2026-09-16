'use client';
import { useActionState } from 'react';
import { createLinkAction, type LinkFormState } from '@/app/actions/links';
import { Button, ErrorText, Input, Label } from './ui';
import { CopyButton } from './copy-button';

export function LinkForm({ host }: { host: string }) {
  const [state, action, pending] = useActionState<LinkFormState, FormData>(createLinkAction, undefined);
  const v = state?.values;

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="url">Destination URL</Label>
        <Input id="url" name="url" type="text" inputMode="url" placeholder="https://example.com/some/long/path" defaultValue={v?.url} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="slug">Custom slug</Label>
          <div className="flex items-center rounded-lg border border-line bg-panel focus-within:border-accent">
            <span className="pl-3 font-mono text-xs text-dim">{host}/</span>
            <input id="slug" name="slug" placeholder="auto" defaultValue={v?.slug} title="3 to 32 characters: letters, numbers, dashes, underscores" pattern="[a-zA-Z0-9][a-zA-Z0-9_\-]{1,30}[a-zA-Z0-9]" className="w-full bg-transparent px-2 py-2 text-sm text-ink placeholder:text-dim focus:outline-none" />
          </div>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Optional label" maxLength={120} defaultValue={v?.title} />
        </div>
        <div>
          <Label htmlFor="expiresAt">Expires</Label>
          <Input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={v?.expiresAt} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create link'}</Button>
        <ErrorText>{state?.error}</ErrorText>
        {state?.created && (
          <span className="flex items-center gap-2 text-sm">
            <a href={state.created.shortUrl} target="_blank" rel="noopener" className="font-mono text-accent-2">{state.created.shortUrl}</a>
            <CopyButton text={state.created.shortUrl} />
          </span>
        )}
      </div>
    </form>
  );
}
