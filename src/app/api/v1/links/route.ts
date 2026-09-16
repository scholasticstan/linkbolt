import type { NextRequest } from 'next/server';
import { authenticate, createLinkSchema, handleLinkError, isResponse, json, parseBody, serializeLink } from '@/lib/api';
import { createLink, listLinks } from '@/lib/links';

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (isResponse(auth)) return auth;
  const links = await listLinks(auth.user.id);
  return json({ links: links.map(serializeLink) });
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (isResponse(auth)) return auth;
  const body = await parseBody(req, createLinkSchema);
  if (isResponse(body)) return body;
  try {
    const link = await createLink({ ...body, userId: auth.user.id });
    return json(serializeLink(link), { status: 201 });
  } catch (err) {
    return handleLinkError(err);
  }
}
