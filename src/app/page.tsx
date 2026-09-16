import Link from 'next/link';
import { ShortenForm } from '@/components/shorten-form';
import { Card, Code } from '@/components/ui';
import { shortHost } from '@/lib/base-url';

const features = [
  ['Custom slugs', 'Pick a memorable path or let LinkBolt generate a 7-character one from a lookalike-free alphabet.'],
  ['Analytics that filter bots', 'Clicks by day, referrer, country, device and browser. Crawlers and link-preview bots are counted separately.'],
  ['Privacy by default', 'Unique visitors are counted with a salted daily hash. IP addresses are never stored.'],
  ['QR codes', 'Every link gets an SVG and PNG QR code endpoint you can drop into print or slides.'],
  ['Expiry', 'Set a date and the link returns 410 Gone afterwards. Anonymous links expire in 7 days on their own.'],
  ['A real API', 'Create, update, delete and read stats with a Bearer key. Rate limited per key, documented with curl.'],
];

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="flex flex-col items-center pt-10 text-center">
        <p className="mb-4 rounded-full border border-line px-3 py-1 font-mono text-xs text-accent-2">{shortHost()}</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Short links that tell you what happened next.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">Shorten a URL, share it, and see real clicks without the bot noise. No tracking pixels, no IP logs.</p>
        <div className="mt-8 flex w-full justify-center"><ShortenForm /></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([title, body]) => (
          <Card key={title}>
            <h2 className="mb-1 font-medium">{title}</h2>
            <p className="text-sm text-muted">{body}</p>
          </Card>
        ))}
      </section>

      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Scriptable from anywhere</h2>
          <p className="mt-2 text-muted">Create a key in settings, then shorten links from a shell, a CI job or your own app. Responses are plain JSON.</p>
          <Link href="/docs" className="mt-4 inline-block text-accent">Read the API docs →</Link>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-muted">{`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/v1/links \\
  -H "Authorization: Bearer lb_..." \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/launch","slug":"launch"}'

{
  "slug": "launch",
  "shortUrl": "${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/launch",
  "clicks": 0,
  ...
}`}</pre>
      </section>

      <section className="rounded-xl border border-line bg-card p-6 text-sm text-muted">
        <h2 className="mb-2 font-medium text-ink">How the redirect works</h2>
        <p>
          A request to <Code>/slug</Code> hits a cached lookup (60 second TTL, LRU bounded), answers with a <Code>302</Code> immediately, and only then writes the click to Postgres. Permanent <Code>301</Code>s are avoided on purpose: browsers cache them and you would stop seeing repeat visits.
        </p>
      </section>
    </div>
  );
}
