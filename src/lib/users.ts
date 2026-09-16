import { sql } from 'drizzle-orm';
import { db, schema } from '@/db';

export async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = lower(${email})`)
    .limit(1);
  return rows[0] ?? null;
}
