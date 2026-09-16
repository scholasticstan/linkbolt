'use client';
import { useActionState } from 'react';
import { createKeyAction, type KeyFormState } from '@/app/actions/api-keys';
import { Button, ErrorText, Input, Label } from './ui';
import { CopyButton } from './copy-button';

export function ApiKeyForm() {
  const [state, action, pending] = useActionState<KeyFormState, FormData>(createKeyAction, undefined);
  return (
    <div className="space-y-4">
      <form action={action} className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="name">Key name</Label>
          <Input id="name" name="name" placeholder="e.g. CLI, Zapier, my-app" maxLength={60} />
        </div>
        <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create key'}</Button>
      </form>
      <ErrorText>{state?.error}</ErrorText>
      {state?.key && (
        <div className="rounded-lg border border-accent-2/40 bg-panel p-4">
          <p className="mb-2 text-sm text-muted">Copy this key now. It is stored hashed and will not be shown again.</p>
          <div className="flex items-center gap-3">
            <code className="break-all font-mono text-sm text-accent-2">{state.key}</code>
            <CopyButton text={state.key} />
          </div>
        </div>
      )}
    </div>
  );
}
