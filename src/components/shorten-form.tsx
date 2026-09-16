'use client';
import { useState, type FormEvent } from 'react';
import { Button, ErrorText, Input } from './ui';
import { CopyButton } from './copy-button';

type Result = { shortUrl: string; slug: string; expiresAt: string | null };

export function ShortenForm() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/shorten', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Something went wrong.');
      else setResult(data);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          inputMode="url"
          placeholder="Paste a long URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          aria-label="URL to shorten"
          className="h-11 text-base"
        />
        <Button type="submit" disabled={busy} className="h-11 px-6">{busy ? 'Working…' : 'Shorten'}</Button>
      </div>
      <ErrorText>{error}</ErrorText>
      {result && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-card p-4 sm:flex-row sm:items-center">
          <a href={result.shortUrl} target="_blank" rel="noopener" className="font-mono text-lg text-accent-2 break-all">{result.shortUrl}</a>
          <div className="ml-auto flex items-center gap-2">
            <CopyButton text={result.shortUrl} />
            <a href={`/api/qr/${result.slug}`} target="_blank" rel="noopener" className="text-sm text-muted hover:text-ink">QR</a>
          </div>
          <p className="w-full text-xs text-dim">Anonymous links expire in 7 days. Sign up for permanent links, custom slugs and analytics.</p>
        </div>
      )}
    </form>
  );
}
