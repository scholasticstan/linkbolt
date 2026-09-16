import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { createLink, deleteLink, getLinkStats, isExpired, LinkError, linkCache, recordClick, resolveLink, updateLink, listLinks } from '@/lib/links';
import { hashPassword } from '@/lib/password';

const info = (over: Partial<Parameters<typeof recordClick>[1]> = {}) => ({
  referrerHost: 'twitter.com', country: 'NG', device: 'mobile', browser: 'Chrome', os: 'Android', bot: false, visitorHash: 'v1', ...over,
});

let userId: string;

beforeEach(async () => {
  await db.execute(sql`truncate table clicks, links, api_keys, sessions, users restart identity cascade`);
  linkCache.clear();
  const [u] = await db.insert(schema.users).values({ email: 'a@example.com', passwordHash: await hashPassword('pw') }).returning();
  userId = u.id;
});

afterAll(async () => {
  await db.execute(sql`truncate table clicks, links, api_keys, sessions, users restart identity cascade`);
});

describe('createLink', () => {
  it('creates with a generated slug and normalised url', async () => {
    const link = await createLink({ url: 'example.com/a', userId });
    expect(link.slug).toHaveLength(7);
    expect(link.url).toBe('https://example.com/a');
    expect(link.userId).toBe(userId);
  });
  it('honours a custom slug and rejects a duplicate with 409', async () => {
    await createLink({ url: 'https://example.com', slug: 'launch' });
    await expect(createLink({ url: 'https://example.com', slug: 'launch' })).rejects.toMatchObject({ status: 409 });
  });
  it('rejects bad input with LinkError', async () => {
    await expect(createLink({ url: 'javascript:alert(1)' })).rejects.toBeInstanceOf(LinkError);
    await expect(createLink({ url: 'https://example.com', slug: 'api' })).rejects.toBeInstanceOf(LinkError);
    await expect(createLink({ url: 'https://example.com', expiresAt: new Date(Date.now() - 1000) })).rejects.toBeInstanceOf(LinkError);
  });
});

describe('resolveLink and cache', () => {
  it('caches hits and misses, and invalidates on update/delete', async () => {
    const link = await createLink({ url: 'https://example.com', slug: 'cached', userId });
    expect(await resolveLink('cached')).toMatchObject({ url: 'https://example.com/' });
    expect(linkCache.get('cached')).toMatchObject({ id: link.id });
    expect(await resolveLink('nope')).toBeNull();
    expect(linkCache.get('nope')).toBeNull();

    await updateLink(link.id, userId, { url: 'https://example.org' });
    expect(await resolveLink('cached')).toMatchObject({ url: 'https://example.org/' });

    expect(await deleteLink(link.id, userId)).toBe(true);
    expect(await resolveLink('cached')).toBeNull();
  });
  it('does not let another user update or delete', async () => {
    const link = await createLink({ url: 'https://example.com', userId });
    const [other] = await db.insert(schema.users).values({ email: 'b@example.com', passwordHash: 'x' }).returning();
    expect(await updateLink(link.id, other.id, { title: 'hijack' })).toBeNull();
    expect(await deleteLink(link.id, other.id)).toBe(false);
    expect((await listLinks(userId)).length).toBe(1);
  });
});

describe('clicks and stats', () => {
  it('records clicks, ignores bots in the counter, and aggregates', async () => {
    const link = await createLink({ url: 'https://example.com', userId });
    await recordClick(link.id, info());
    await recordClick(link.id, info({ visitorHash: 'v2', referrerHost: null, device: 'desktop', browser: 'Safari' }));
    await recordClick(link.id, info({ visitorHash: 'v1' }));
    await recordClick(link.id, info({ bot: true, visitorHash: null }));

    const [row] = await db.select().from(schema.links);
    expect(row.clickCount).toBe(3);

    const s = await getLinkStats(link.id, 7);
    expect(s).toMatchObject({ total: 4, humans: 3, bots: 1, uniques: 2 });
    expect(s.byDay).toHaveLength(7);
    expect(s.byDay[6].clicks).toBe(3);
    expect(s.referrers).toEqual([{ name: 'twitter.com', clicks: 2 }, { name: 'Direct', clicks: 1 }]);
    expect(s.devices.find((d) => d.name === 'mobile')?.clicks).toBe(2);
  });
  it('isExpired', () => {
    expect(isExpired({ expiresAt: null })).toBe(false);
    expect(isExpired({ expiresAt: new Date(Date.now() - 1) })).toBe(true);
    expect(isExpired({ expiresAt: new Date(Date.now() + 60_000) })).toBe(false);
  });
});
