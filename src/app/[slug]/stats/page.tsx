import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLinkBySlug, getLinkStats } from '@/lib/links';
import { shortUrl } from '@/lib/base-url';
import { StatsView } from '@/components/stats-view';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Stats for /${slug}` };
}
export const dynamic = 'force-dynamic';

export default async function PublicStatsPage({ params }: Props) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link) notFound();
  const user = await getCurrentUser();
  const isOwner = !!user && link.userId === user.id;
  if (!link.publicStats && !isOwner) notFound();
  const stats = await getLinkStats(link.id, 30);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Public stats</p>
        <h1 className="font-mono text-2xl text-accent-2">{shortUrl(link.slug)}</h1>
        {link.title && <p className="text-muted">{link.title}</p>}
      </div>
      <StatsView stats={stats} days={30} />
    </div>
  );
}
