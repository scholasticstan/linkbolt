import type { LinkStats } from '@/lib/links';
import { formatNumber } from '@/lib/format';
import { Breakdown, DailyBars, StatCard } from './charts';
import { Card } from './ui';

export function StatsView({ stats, days }: { stats: LinkStats; days: number }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Clicks" value={formatNumber(stats.humans)} hint={`last ${days} days`} />
        <StatCard label="Unique visitors" value={formatNumber(stats.uniques)} hint="daily-hashed, no IPs stored" />
        <StatCard label="Bots filtered" value={formatNumber(stats.bots)} hint="crawlers and link previews" />
        <StatCard label="Top country" value={stats.countries[0]?.name ?? '—'} />
      </div>
      <Card>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Clicks per day</h3>
        <DailyBars data={stats.byDay} />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card><Breakdown title="Referrers" rows={stats.referrers} total={stats.humans} /></Card>
        <Card><Breakdown title="Countries" rows={stats.countries} total={stats.humans} /></Card>
        <Card><Breakdown title="Devices" rows={stats.devices} total={stats.humans} /></Card>
        <Card><Breakdown title="Browsers" rows={stats.browsers} total={stats.humans} /></Card>
      </div>
    </div>
  );
}
