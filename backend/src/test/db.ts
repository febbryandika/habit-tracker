import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import path from 'node:path'
import * as authSchema from '../db/auth-schema'
import * as schema from '../db/schema'

const migrationsFolder = path.join(import.meta.dirname, '../../drizzle')

// Creates an in-memory Postgres DB per test run via PGlite, applies the same
// migrations used in production, and returns the typed Drizzle client.
//
// Usage in integration tests (must mock BEFORE importing app):
//   const { db, client } = await createTestDb()
//   mock.module('../db', () => ({ db }))
//   const { app } = await import('../index')
//   ...
//   afterAll(() => client.close())
export async function createTestDb() {
  const client = new PGlite()
  const db = drizzle({ client, schema: { ...schema, ...authSchema } })
  await migrate(db, { migrationsFolder })
  return { db, client }
}
