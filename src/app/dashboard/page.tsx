import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { isExpired, listLinks } from '@/lib/links';
import { shortHost, shortUrl } from '@/lib/base-url';
import { formatNumber, relativeTime, truncate } from '@/lib/format';
import { LinkForm } from '@/components/link-form';
import { CopyButton } from '@/components/copy-button';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const links = await listLinks(user.id);
  const totalClicks = links.reduce((n, l) => n + l.clickCount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your links</h1>
          <p className="text-sm text-muted">{links.length} links · {formatNumber(totalClicks)} clicks all time</p>
        </div>
        <Link href="/dashboard/settings" className="text-sm text-muted hover:text-ink">API keys &amp; settings →</Link>
      </div>

      <Card><LinkForm host={shortHost()} /></Card>

      {links.length === 0 ? (
        <p className="text-sm text-dim">No links yet. Create one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-panel text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Short link</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {links.map((l) => {
                const expired = isExpired(l);
                return (
                  <tr key={l.id} className="hover:bg-panel/60">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/${l.slug}`} className="font-mono text-accent-2">/{l.slug}</Link>
                      {l.title && <div className="text-xs text-muted">{l.title}</div>}
                      {expired && <span className="ml-2 rounded bg-danger/15 px-1.5 text-xs text-danger">expired</span>}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted"><span title={l.url}>{truncate(l.url, 56)}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNumber(l.clickCount)}</td>
                    <td className="px-4 py-3 text-muted">{relativeTime(l.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><CopyButton text={shortUrl(l.slug)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
