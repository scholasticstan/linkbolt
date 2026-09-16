import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  integer,
  bigserial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('users_email_idx').on(sql`lower(${t.email})`)]);

export const sessions = pgTable('sessions', {
  // sha256 of the cookie token; the raw token never touches the database
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('sessions_user_idx').on(t.userId)]);

export const links = pgTable('links', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull(),
  url: text('url').notNull(),
  title: text('title'),
  // null for anonymous links created from the landing page
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  publicStats: boolean('public_stats').notNull().default(false),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('links_slug_idx').on(t.slug),
  index('links_user_created_idx').on(t.userId, t.createdAt),
]);

export const clicks = pgTable('clicks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  linkId: uuid('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
  referrerHost: text('referrer_host'),
  country: text('country'),
  device: text('device'),
  browser: text('browser'),
  os: text('os'),
  bot: boolean('bot').notNull().default(false),
  // sha256(ip + user agent + daily salt): lets us count uniques without storing IPs
  visitorHash: text('visitor_hash'),
}, (t) => [index('clicks_link_ts_idx').on(t.linkId, t.ts)]);

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // first 8 chars shown in the UI so a user can tell keys apart
  prefix: text('prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('api_keys_hash_idx').on(t.keyHash), index('api_keys_user_idx').on(t.userId)]);

export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, { fields: [links.userId], references: [users.id] }),
  clicks: many(clicks),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  link: one(links, { fields: [clicks.linkId], references: [links.id] }),
}));

export type User = typeof users.$inferSelect;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Click = typeof clicks.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
