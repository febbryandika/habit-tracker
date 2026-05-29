import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from './schema'
import * as authSchema from './auth-schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

// Bun's native SQL driver over the Neon connection string (TCP + SSL via sslmode in the URL).
// Connection is lazy — opened on first query, not at import time.
export const db = drizzle(url, { schema: { ...schema, ...authSchema } })
