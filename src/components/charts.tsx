import { formatNumber } from '@/lib/format';

export function DailyBars({ data }: { data: { day: string; clicks: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const w = 720, h = 160, pad = 4;
  const bw = (w - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h + 22}`} className="h-auto w-full" role="img" aria-label="Clicks per day">
      {data.map((d, i) => {
        const bh = (d.clicks / max) * h;
        const x = pad + i * bw;
        return (
          <g key={d.day}>
            <title>{`${d.day}: ${d.clicks}`}</title>
            <rect x={x + 1} y={h - bh} width={Math.max(1, bw - 2)} height={bh} rx={2} fill="var(--color-accent)" opacity={d.clicks ? 0.95 : 0.25} />
            {(data.length - 1 - i) % 7 === 0 && (
              <text x={x + bw / 2} y={h + 16} textAnchor="middle" fontSize="10" fill="var(--color-dim)">{d.day.slice(5)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Breakdown({ title, rows, total }: { title: string; rows: { name: string; clicks: number }[]; total: number }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-dim">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const pct = total ? Math.round((r.clicks / total) * 100) : 0;
            return (
              <li key={r.name} className="text-sm">
                <div className="mb-1 flex justify-between">
                  <span className="truncate">{r.name}</span>
                  <span className="tabular-nums text-muted">{formatNumber(r.clicks)} · {pct}%</span>
                </div>
                <div className="h-1.5 rounded bg-line"><div className="h-full rounded bg-accent-2" style={{ width: `${pct}%` }} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-dim">{hint}</div>}
    </div>
  );
}
