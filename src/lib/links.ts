import { and, desc, eq, gte, isNull, or, sql, count, countDistinct } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db, schema, type Db } from '@/db';
import type { Link } from '@/db/schema';
import { TtlCache } from './cache';
import { generateSlug, validateCustomSlug } from './slug';
import { validateDestination } from './url';
import type { ClickInfo } from './clicks';

/** Hot path cache: slug -> the few fields the redirect needs. */
export type ResolvedLink = Pick<Link, 'id' | 'slug' | 'url' | 'expiresAt'>;
export const linkCache = new TtlCache<ResolvedLink | null>(5000, 60_000);

/** Drizzle wraps driver errors; the SQLSTATE lives on either the error or its cause. */
function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

export class LinkError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type CreateLinkInput = {
  url: string;
  slug?: string | null;
  title?: string | null;
  userId?: string | null;
  expiresAt?: Date | null;
  publicStats?: boolean;
};

export async function createLink(input: CreateLinkInput, database: Db = db): Promise<Link> {
  const dest = validateDestination(input.url, process.env.NEXT_PUBLIC_APP_URL);
  if (!dest.ok) throw new LinkError(dest.reason);

  let slug: string;
  if (input.slug && input.slug.trim()) {
    const check = validateCustomSlug(input.slug);
    if (!check.ok) throw new LinkError(check.reason);
    slug = check.slug;
  } else {
    slug = generateSlug();
  }

  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    throw new LinkError('Expiry must be in the future.');
  }

  const title = input.title?.trim().slice(0, 120) || null;

  // Retry on collision only for generated slugs; a taken custom slug is a user error.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [row] = await database
        .insert(schema.links)
        .values({
          slug,
          url: dest.url,
          title,
          userId: input.userId ?? null,
          expiresAt: input.expiresAt ?? null,
          publicStats: input.publicStats ?? false,
        })
        .returning();
      return row;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      if (input.slug) throw new LinkError('That slug is already taken.', 409);
      slug = generateSlug();
    }
  }
  throw new LinkError('Could not allocate a slug, please try again.', 500);
}

/** Resolve a slug for redirecting. Cached, including negative results. */
export async function resolveLink(slug: string, database: Db = db): Promise<ResolvedLink | null> {
  const cached = linkCache.get(slug);
  if (cached !== undefined) return cached;
  const rows = await database
    .select({ id: schema.links.id, slug: schema.links.slug, url: schema.links.url, expiresAt: schema.links.expiresAt })
    .from(schema.links)
    .where(eq(schema.links.slug, slug))
    .limit(1);
  const link = rows[0] ?? null;
  linkCache.set(slug, link);
  return link;
}

export function isExpired(link: { expiresAt: Date | null }, now = new Date()) {
  return !!link.expiresAt && link.expiresAt.getTime() <= now.getTime();
}

export async function recordClick(linkId: string, info: ClickInfo, database: Db = db) {
  await database.transaction(async (tx) => {
    await tx.insert(schema.clicks).values({ linkId, ...info });
    if (!info.bot) {
      await tx
        .update(schema.links)
        .set({ clickCount: sql`${schema.links.clickCount} + 1` })
        .where(eq(schema.links.id, linkId));
    }
  });
}

export async function getLinkBySlug(slug: string, database: Db = db) {
  const rows = await database.select().from(schema.links).where(eq(schema.links.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function listLinks(userId: string, database: Db = db, limit = 100) {
  return database
    .select()
    .from(schema.links)
    .where(eq(schema.links.userId, userId))
    .orderBy(desc(schema.links.createdAt))
    .limit(limit);
}

export type UpdateLinkInput = Partial<Pick<CreateLinkInput, 'url' | 'title' | 'expiresAt' | 'publicStats'>>;

export async function updateLink(id: string, userId: string, patch: UpdateLinkInput, database: Db = db) {
  const set: Partial<typeof schema.links.$inferInsert> = { updatedAt: new Date() };
  if (patch.url !== undefined) {
    const dest = validateDestination(patch.url, process.env.NEXT_PUBLIC_APP_URL);
    if (!dest.ok) throw new LinkError(dest.reason);
    set.url = dest.url;
  }
  if (patch.title !== undefined) set.title = patch.title?.trim().slice(0, 120) || null;
  if (patch.expiresAt !== undefined) set.expiresAt = patch.expiresAt;
  if (patch.publicStats !== undefined) set.publicStats = patch.publicStats;

  const [row] = await database
    .update(schema.links)
    .set(set)
    .where(and(eq(schema.links.id, id), eq(schema.links.userId, userId)))
    .returning();
  if (row) linkCache.delete(row.slug);
  return row ?? null;
}

export async function deleteLink(id: string, userId: string, database: Db = db) {
  const [row] = await database
    .delete(schema.links)
    .where(and(eq(schema.links.id, id), eq(schema.links.userId, userId)))
    .returning({ slug: schema.links.slug });
  if (row) linkCache.delete(row.slug);
  return !!row;
}

export type LinkStats = {
  total: number;
  humans: number;
  bots: number;
  uniques: number;
  byDay: { day: string; clicks: number }[];
  referrers: { name: string; clicks: number }[];
  countries: { name: string; clicks: number }[];
  devices: { name: string; clicks: number }[];
  browsers: { name: string; clicks: number }[];
};

export async function getLinkStats(linkId: string, days = 30, database: Db = db): Promise<LinkStats> {
  const since = new Date(Date.now() - days * 86_400_000);
  const c = schema.clicks;
  const scope = and(eq(c.linkId, linkId), gte(c.ts, since));
  const humans = and(scope, eq(c.bot, false));

  const [totals] = await database
    .select({
      total: count(),
      bots: count(sql`case when ${c.bot} then 1 end`),
      uniques: countDistinct(sql`case when not ${c.bot} then ${c.visitorHash} end`),
    })
    .from(c)
    .where(scope);

  const byDayRows = await database
    .select({ day: sql<string>`to_char(date_trunc('day', ${c.ts}), 'YYYY-MM-DD')`, clicks: count() })
    .from(c)
    .where(humans)
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  // Fill missing days with zeros so charts don't have gaps.
  const map = new Map(byDayRows.map((r) => [r.day, Number(r.clicks)]));
  const byDay: LinkStats['byDay'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    byDay.push({ day, clicks: map.get(day) ?? 0 });
  }

  const top = async (column: AnyPgColumn, fallback: string) => {
    const rows = await database
      .select({ name: sql<string>`coalesce(${column}, ${fallback})`, clicks: count() })
      .from(c)
      .where(humans)
      .groupBy(sql`1`)
      .orderBy(desc(count()))
      .limit(8);
    return rows.map((r) => ({ name: r.name, clicks: Number(r.clicks) }));
  };

  const [referrers, countries, devices, browsers] = await Promise.all([
    top(c.referrerHost, 'Direct'),
    top(c.country, 'Unknown'),
    top(c.device, 'desktop'),
    top(c.browser, 'Unknown'),
  ]);

  const total = Number(totals?.total ?? 0);
  const bots = Number(totals?.bots ?? 0);
  return {
    total,
    bots,
    humans: total - bots,
    uniques: Number(totals?.uniques ?? 0),
    byDay,
    referrers,
    countries,
    devices,
    browsers,
  };
}

/** Anonymous links older than their expiry, and expired user links, can be swept by a cron. */
export async function purgeExpired(database: Db = db) {
  const rows = await database
    .delete(schema.links)
    .where(or(and(isNull(schema.links.userId), sql`${schema.links.expiresAt} < now()`), sql`${schema.links.expiresAt} < now() - interval '30 days'`))
    .returning({ slug: schema.links.slug });
  for (const r of rows) linkCache.delete(r.slug);
  return rows.length;
}
