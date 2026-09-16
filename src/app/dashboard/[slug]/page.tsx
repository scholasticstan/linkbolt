import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLinkBySlug, getLinkStats } from '@/lib/links';
import { shortUrl } from '@/lib/base-url';
import { CopyButton } from '@/components/copy-button';
import { EditLinkForm } from '@/components/edit-link-form';
import { DeleteLinkButton } from '@/components/delete-link-button';
import { StatsView } from '@/components/stats-view';
import { Card } from '@/components/ui';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ days?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `/${slug}` };
}
export const dynamic = 'force-dynamic';

function toLocalInput(d: Date | null) {
  if (!d) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function LinkPage({ params, searchParams }: Props) {
  const user = (await getCurrentUser())!;
  const { slug } = await params;
  const { days: daysParam } = await searchParams;
  const link = await getLinkBySlug(slug);
  if (!link || link.userId !== user.id) notFound();

  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30;
  const stats = await getLinkStats(link.id, days);
  const url = shortUrl(link.slug);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-ink">← All links</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl text-accent-2">{url}</h1>
          <CopyButton text={url} />
          <a href={`/api/qr/${link.slug}?format=png&size=512`} download={`${link.slug}.png`} className="text-sm text-muted hover:text-ink">Download QR</a>
          {link.publicStats && <a href={`/${link.slug}/stats`} target="_blank" rel="noopener" className="text-sm text-muted hover:text-ink">Public stats ↗</a>}
        </div>
        <p className="mt-1 break-all text-sm text-muted">→ {link.url}</p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {[7, 30, 90].map((d) => (
          <Link key={d} href={`?days=${d}`} className={`rounded-md border px-3 py-1 ${d === days ? 'border-accent text-ink' : 'border-line text-muted hover:text-ink'}`}>{d} days</Link>
        ))}
      </div>

      <StatsView stats={stats} days={days} />

      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <Card>
          <h2 className="mb-4 font-medium">Edit</h2>
          <EditLinkForm id={link.id} slug={link.slug} url={link.url} title={link.title} expiresAt={toLocalInput(link.expiresAt)} publicStats={link.publicStats} />
          <div className="mt-6 border-t border-line pt-4"><DeleteLinkButton id={link.id} slug={link.slug} /></div>
        </Card>
        <Card className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/qr/${link.slug}?size=200`} width={180} height={180} alt={`QR code for ${url}`} className="rounded-lg bg-white p-2" />
          <span className="text-xs text-dim">Scans go through the short link</span>
        </Card>
      </div>
    </div>
  );
}
