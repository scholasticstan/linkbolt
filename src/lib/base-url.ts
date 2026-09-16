export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export function shortUrl(slug: string): string {
  return `${appUrl()}/${slug}`;
}

export function shortHost(): string {
  try {
    return new URL(appUrl()).host;
  } catch {
    return 'localhost:3000';
  }
}
