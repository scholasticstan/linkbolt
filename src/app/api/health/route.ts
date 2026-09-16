import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { json, error } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return json({ ok: true, db: 'up', time: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return error('Database unreachable.', 503);
  }
}
