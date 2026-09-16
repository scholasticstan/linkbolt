'use client';
import { useState } from 'react';
import { Button } from './ui';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable, nothing to do */
        }
      }}
    >
      {done ? 'Copied' : label}
    </Button>
  );
}
