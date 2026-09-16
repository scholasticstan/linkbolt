import type { NextRequest } from 'next/server';
import { authenticate, error, isResponse, json } from '@/lib/api';
import { getLinkBySlug, getLinkStats } from '@/lib/links';

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await authenticate(req);
  if (isResponse(auth)) return auth;
  const { slug } = await ctx.params;
  const link = await getLinkBySlug(slug);
  if (!link || link.userId !== auth.user.id) return error('Link not found.', 404);
  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get('days') ?? 30) || 30));
  const stats = await getLinkStats(link.id, days);
  return json({ slug: link.slug, days, ...stats });
}
