/**
 * Issue an API key for a user from the command line, creating the user if needed.
 *   npx tsx scripts/create-api-key.mts you@example.com [key-name]
 * Prints the plaintext key once. Reads DATABASE_URL from .env.local.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
const { db, schema } = await import('../src/db');
const { hashPassword } = await import('../src/lib/password');
const { generateApiKey } = await import('../src/lib/api-keys');
const { findUserByEmail } = await import('../src/lib/users');

const [email, name = 'cli'] = process.argv.slice(2);
if (!email) {
  console.error('usage: create-api-key <email> [name]');
  process.exit(1);
}

let user = await findUserByEmail(email);
if (!user) {
  const password = crypto.randomUUID();
  [user] = await db.insert(schema.users).values({ email, passwordHash: await hashPassword(password) }).returning();
  console.error(`created user ${email} with password ${password}`);
}
const { key, prefix, keyHash } = generateApiKey();
await db.insert(schema.apiKeys).values({ userId: user.id, name, prefix, keyHash });
console.log(key);
process.exit(0);
