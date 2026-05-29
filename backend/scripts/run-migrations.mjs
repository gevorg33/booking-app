#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const migrationsDir = join(backendRoot, 'database', 'migrations');

loadEnv({ path: join(backendRoot, '.env') });
loadEnv({ path: join(backendRoot, '.env.local'), override: true });

function connectionConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  const user = process.env.DB_USERNAME;
  if (!user) {
    throw new Error(
      'Database user not configured. Set DB_USERNAME in backend/.env (or DATABASE_URL).',
    );
  }
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'booking_platform',
  };
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function isApplied(client, filename) {
  const result = await client.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1',
    [filename],
  );
  return result.rowCount > 0;
}

async function markApplied(client, filename) {
  await client.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
    [filename],
  );
}

async function main() {
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.log('No migration files found.');
    return;
  }

  const client = new pg.Client(connectionConfig());
  await client.connect();

  try {
    await ensureMigrationsTable(client);

    let applied = 0;
    let skipped = 0;

    for (const file of files) {
      if (await isApplied(client, file)) {
        console.log(`Skipping ${file} (already applied)`);
        skipped += 1;
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), 'utf8');
      console.log(`Applying ${file}...`);
      await client.query(sql);
      await markApplied(client, file);
      console.log('  OK');
      applied += 1;
    }

    console.log(`Done. Applied ${applied}, skipped ${skipped}.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
