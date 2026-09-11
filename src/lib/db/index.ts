import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type AppDatabase = DrizzleD1Database<typeof schema>;

/**
 * Creates a Drizzle ORM client instance wrapping a Cloudflare D1 database.
 * The D1Database binding must be explicitly passed in.
 *
 * @param d1 - Cloudflare D1 database instance
 * @returns Configured Drizzle ORM client
 */
export function createDb(d1: D1Database): AppDatabase {
  if (!d1) {
    throw new Error('Database connection failed: D1Database instance was not provided');
  }
  return drizzle(d1, { schema });
}
