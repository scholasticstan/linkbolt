import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { relativeTime } from '@/lib/format';
import { revokeKeyAction } from '@/app/actions/api-keys';
import { ApiKeyForm } from '@/components/api-key-form';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  const keys = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.userId, user.id)).orderBy(desc(schema.apiKeys.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Signed in as {user.email}</p>
      </div>

      <Card>
        <h2 className="mb-1 font-medium">API keys</h2>
        <p className="mb-4 text-sm text-muted">Send <span className="font-mono">Authorization: Bearer &lt;key&gt;</span> to the endpoints in the <Link href="/docs" className="text-accent">docs</Link>. Keys are hashed at rest.</p>
        <ApiKeyForm />
        {keys.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium">{k.name}</span> <span className="font-mono text-muted">{k.prefix}…</span>
                  <div className="text-xs text-dim">created {relativeTime(k.createdAt)}{k.lastUsedAt ? ` · last used ${relativeTime(k.lastUsedAt)}` : ' · never used'}</div>
                </div>
                <form action={revokeKeyAction}>
                  <input type="hidden" name="id" value={k.id} />
                  <Button type="submit" variant="danger">Revoke</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
