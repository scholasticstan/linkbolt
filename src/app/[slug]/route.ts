import { after, type NextRequest } from 'next/server';
import { isExpired, recordClick, resolveLink } from '@/lib/links';
import { parseClick } from '@/lib/clicks';

export const dynamic = 'force-dynamic';

function page(title: string, body: string, status: number) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#0b0d12;color:#e6e9f2}main{text-align:center;padding:2rem}h1{font-size:1.6rem;margin:0 0 .5rem}p{color:#9aa3b8;margin:0 0 1.2rem}a{color:#7c9cff}</style></head>
<body><main><h1>${title}</h1><p>${body}</p><a href="/">Go to LinkBolt</a></main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}

async function handle(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const link = await resolveLink(slug);

  if (!link) return page('Link not found', 'This short link does not exist or has been removed.', 404);
  if (isExpired(link)) return page('Link expired', 'This short link has expired.', 410);

  // Record the click after the redirect has been sent so the visitor never waits on Postgres.
  if (req.method === 'GET') {
    const info = parseClick(req.headers);
    after(async () => {
      try {
        await recordClick(link.id, info);
      } catch (err) {
        console.error('recordClick failed', err);
      }
    });
  }

  // 302 not 301: browsers cache permanent redirects and would skip us on repeat visits.
  return new Response(null, {
    status: 302,
    headers: {
      location: link.url,
      'cache-control': 'private, no-store',
      'referrer-policy': 'unsafe-url',
    },
  });
}

export const GET = handle;
export const HEAD = handle;
