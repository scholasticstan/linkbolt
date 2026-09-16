import type { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { resolveLink } from '@/lib/links';
import { shortUrl } from '@/lib/base-url';
import { error } from '@/lib/api';

/** QR code for a short link. Public: anyone who has the slug can already visit it. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const link = await resolveLink(slug);
  if (!link) return error('Link not found.', 404);

  const format = req.nextUrl.searchParams.get('format') === 'png' ? 'png' : 'svg';
  const size = Math.min(1024, Math.max(128, Number(req.nextUrl.searchParams.get('size') ?? 320) || 320));
  const target = shortUrl(slug);
  const opts = { margin: 1, color: { dark: '#0b0d12', light: '#ffffff' } };

  if (format === 'png') {
    const buf = await QRCode.toBuffer(target, { ...opts, type: 'png', width: size });
    return new Response(new Uint8Array(buf), {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400', 'content-disposition': `inline; filename="${slug}.png"` },
    });
  }
  const svg = await QRCode.toString(target, { ...opts, type: 'svg', width: size });
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' } });
}
