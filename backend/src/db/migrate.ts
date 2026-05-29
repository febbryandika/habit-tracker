import { drizzle } from 'drizzle-orm/bun-sql'
import { migrate } from 'drizzle-orm/bun-sql/migrator'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

// Applies pending migrations from ./drizzle using the Bun-native driver
// (consistent with the runtime connection; no separate pg driver).
const db = drizzle(url)
await migrate(db, { migrationsFolder: './drizzle' })
console.log('✓ Migrations up to date.')
process.exit(0)
