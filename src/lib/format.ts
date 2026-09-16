export function formatNumber(n: number) {
  return new Intl.NumberFormat('en', { notation: n >= 10_000 ? 'compact' : 'standard' }).format(n);
}

export function relativeTime(date: Date, now = new Date()) {
  const diff = (date.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 30 * 86_400) return rtf.format(Math.round(diff / 86_400), 'day');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function truncate(s: string, max = 60) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
