import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, Code } from '@/components/ui';
import { appUrl } from '@/lib/base-url';

export const metadata: Metadata = { title: 'API' };

function Block({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-lg border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-muted">{children}</pre>;
}

export default function DocsPage() {
  const base = appUrl();
  return (
    <div className="prose-invert max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">API</h1>
        <p className="mt-2 text-muted">All endpoints live under <Code>{base}/api/v1</Code>, take and return JSON, and need an API key from <Link href="/dashboard/settings" className="text-accent">settings</Link>. Limits: 120 requests per minute per key.</p>
      </div>

      <Card>
        <h2 className="font-medium">Authentication</h2>
        <Block>{`Authorization: Bearer lb_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Block>
        <p className="mt-2 text-sm text-muted">A missing or unknown key returns <Code>401</Code>. Over the limit returns <Code>429</Code> with a <Code>retryAfter</Code> field in seconds.</p>
      </Card>

      <Card>
        <h2 className="font-medium">Create a link</h2>
        <Block>{`POST /api/v1/links
{
  "url": "https://example.com/very/long/path",   // required
  "slug": "launch",                              // optional, 3–32 chars [a-zA-Z0-9_-]
  "title": "Launch post",                        // optional
  "expiresAt": "2026-12-31T23:59:00Z",           // optional ISO date
  "publicStats": false                           // optional
}

201 →
{
  "id": "…", "slug": "launch", "shortUrl": "${base}/launch",
  "url": "https://example.com/very/long/path", "title": "Launch post",
  "clicks": 0, "publicStats": false, "expiresAt": "…", "createdAt": "…", "updatedAt": "…"
}

400 invalid url / slug · 409 slug already taken`}</Block>
      </Card>

      <Card>
        <h2 className="font-medium">List, read, update, delete</h2>
        <Block>{`GET    /api/v1/links              → { "links": [ … ] }
GET    /api/v1/links/:slug        → link
PATCH  /api/v1/links/:slug        { "url"?, "title"?, "expiresAt"?, "publicStats"? } → link
DELETE /api/v1/links/:slug        → 204`}</Block>
      </Card>

      <Card>
        <h2 className="font-medium">Stats</h2>
        <Block>{`GET /api/v1/links/:slug/stats?days=30     (1–90)

{
  "slug": "launch", "days": 30,
  "total": 1240, "humans": 1180, "bots": 60, "uniques": 902,
  "byDay":     [ { "day": "2026-09-01", "clicks": 41 }, … ],
  "referrers": [ { "name": "twitter.com", "clicks": 512 }, { "name": "Direct", "clicks": 300 } ],
  "countries": [ { "name": "NG", "clicks": 640 }, … ],
  "devices":   [ { "name": "mobile", "clicks": 800 }, … ],
  "browsers":  [ { "name": "Chrome", "clicks": 700 }, … ]
}`}</Block>
        <p className="mt-2 text-sm text-muted">Bots are detected from the user agent and excluded from every breakdown. Uniques are counted from a daily salted hash of IP and user agent, so the same visitor counts once per day and no IP is ever stored.</p>
      </Card>

      <Card>
        <h2 className="font-medium">Public endpoints</h2>
        <Block>{`GET /:slug                         302 → destination (410 if expired, 404 if unknown)
GET /api/qr/:slug?format=svg|png&size=320
POST /api/shorten { "url" }        anonymous, 10 per hour per IP, links expire in 7 days
GET /api/health`}</Block>
      </Card>

      <Card>
        <h2 className="font-medium">Example</h2>
        <Block>{`curl -s -X POST ${base}/api/v1/links \\
  -H "Authorization: Bearer $LINKBOLT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://github.com/scholasticstan/linkbolt","slug":"src"}' | jq .shortUrl`}</Block>
      </Card>
    </div>
  );
}
