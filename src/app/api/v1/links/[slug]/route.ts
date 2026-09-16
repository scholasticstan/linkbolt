import type { NextRequest } from 'next/server';
import { authenticate, error, handleLinkError, isResponse, json, parseBody, serializeLink, updateLinkSchema } from '@/lib/api';
import { deleteLink, getLinkBySlug, updateLink } from '@/lib/links';

type Ctx = { params: Promise<{ slug: string }> };

async function ownedLink(slug: string, userId: string) {
  const link = await getLinkBySlug(slug);
  if (!link || link.userId !== userId) return null;
  return link;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await authenticate(req);
  if (isResponse(auth)) return auth;
  const { slug } = await ctx.params;
  const link = await ownedLink(slug, auth.user.id);
  if (!link) return error('Link not found.', 404);
  return json(serializeLink(link));
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await authenticate(req);
  if (isResponse(auth)) return auth;
  const { slug } = await ctx.params;
  const link = await ownedLink(slug, auth.user.id);
  if (!link) return error('Link not found.', 404);
  const body = await parseBody(req, updateLinkSchema);
  if (isResponse(body)) return body;
  try {
    const updated = await updateLink(link.id, auth.user.id, body);
    return updated ? json(serializeLink(updated)) : error('Link not found.', 404);
  } catch (err) {
    return handleLinkError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await authenticate(req);
  if (isResponse(auth)) return auth;
  const { slug } = await ctx.params;
  const link = await ownedLink(slug, auth.user.id);
  if (!link) return error('Link not found.', 404);
  await deleteLink(link.id, auth.user.id);
  return new Response(null, { status: 204 });
}
