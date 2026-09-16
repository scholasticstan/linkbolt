# LinkBolt

Short links with honest analytics. Custom slugs, click stats that separate humans from bots, QR codes, expiry, and a JSON API with per-key rate limits.

Built with Next.js 16 (App Router, server actions), TypeScript, Postgres via Drizzle, Tailwind v4, Vitest. No client-side state library, no tracking pixels, no IP addresses stored.

## What it does

- **Shorten**: paste a URL, get `host/xxxxxxx`. Signed-in users can pick a custom slug, add a title and an expiry date. Anonymous links from the landing page expire after seven days and are rate limited per IP.
- **Redirect**: `GET /:slug` answers `302` from an in-process LRU cache (60s TTL) and records the click *after* the response is sent, so the visitor never waits on the database. Expired links return `410`, unknown ones `404`.
- **Analytics**: clicks per day, referrers, countries, devices and browsers for 7/30/90 days. Crawlers and link-preview bots are detected from the user agent and reported separately. Unique visitors are a salted daily hash of IP + user agent; the IP itself is discarded.
- **QR**: `/api/qr/:slug?format=svg|png&size=320` for every link.
- **API**: create, list, read, update, delete and stats under `/api/v1` with `Authorization: Bearer lb_…`. Keys are stored as SHA-256 hashes, shown once, and limited to 120 requests per minute each. Docs live at `/docs`.
- **Public stats page**: toggle per link, served at `/:slug/stats`.

## Running it

Requirements: Node 22, Postgres 14+.

```bash
cp .env.example .env.local        # set DATABASE_URL and VISITOR_SALT
npm install
npm run db:migrate
npm run dev                       # http://localhost:3000
```

Tests need a second database, referenced from `.env.test`:

```bash
createdb linkbolt_test
DATABASE_URL=postgres://localhost/linkbolt_test npm run db:migrate
npm test
```

`npm run lint`, `npm run typecheck` and `npm run build` are what CI runs.

Issue an API key from the command line:

```bash
npx tsx scripts/create-api-key.mts you@example.com laptop
```

## Layout

```
src/
  app/
    [slug]/route.ts          redirect handler (302, after() click recording)
    [slug]/stats/page.tsx    public stats page
    api/v1/…                 authenticated JSON API
    api/shorten, api/qr      anonymous shorten, QR endpoint
    dashboard/…              links table, per-link analytics, settings / API keys
    actions/                 server actions for auth, links, keys
  db/schema.ts               users, sessions, links, clicks, api_keys
  lib/
    links.ts                 create/resolve/update/delete + stats SQL
    clicks.ts                user-agent parsing, bot detection, visitor hash
    ratelimit.ts             sliding window limiter (in-process)
    cache.ts                 bounded LRU with TTL
    url.ts / slug.ts         validation: schemes, private hosts, reserved slugs
    auth.ts                  DB-backed sessions in an httpOnly cookie
tests/                       unit tests for the pure modules, integration tests against Postgres
```

## Decisions worth knowing

- **302 over 301.** Browsers cache permanent redirects, which silently stops repeat visits from ever reaching the server. Temporary redirects keep the numbers honest at the cost of one extra hop.
- **Click recording after the response.** `after()` from `next/server` runs the insert once the redirect is flushed. If Postgres is slow, the visitor doesn't notice.
- **Cached negative lookups.** A missing slug is cached as `null` for the same TTL, so someone hammering random slugs doesn't turn into database load.
- **Slug alphabet without lookalikes.** No `0/O`, `1/l/I`. Seven characters gives roughly 2.8 trillion combinations; collisions retry up to three times.
- **Sessions in the database, not JWTs.** Log out actually revokes. The cookie holds a random token; only its hash is stored.
- **Rate limiting is per process.** Fine on one instance, approximate on many. The limiter's interface is one function so it can be swapped for Redis without touching callers.
- **Bot clicks are stored, not dropped.** They're excluded from the counter and every breakdown but kept so the "bots filtered" number is real.

## Deploying

Any Node host works. For Vercel + Neon: set `DATABASE_URL`, `VISITOR_SALT`, `NEXT_PUBLIC_APP_URL`, run `npm run db:migrate` once against the production database, deploy. Country detection uses the `x-vercel-ip-country` header (or `cf-ipcountry` behind Cloudflare) and falls back to "Unknown" elsewhere.

## Licence

MIT
