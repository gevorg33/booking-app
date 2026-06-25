#!/usr/bin/env node
/**
 * Fresh Postgres (Railway/production): TypeORM synchronize base schema once,
 * then SQL migrations apply incremental changes.
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';
import { DataSource } from 'typeorm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const migrationsDir = join(backendRoot, 'database', 'migrations');

loadEnv({ path: join(backendRoot, '.env') });
loadEnv({ path: join(backendRoot, '.env.local'), override: true });

function connectionConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'booking_platform',
  };
}

async function coreTablesExist(client) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'businesses' LIMIT 1`,
  );
  return (result.rowCount ?? 0) > 0;
}

async function markAllMigrationsApplied(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
      [file],
    );
  }
  console.log(`Schema bootstrap: marked ${files.length} SQL migrations as applied.`);
}

async function main() {
  const client = new pg.Client(connectionConfig());
  await client.connect();
  try {
    if (await coreTablesExist(client)) {
      console.log('Schema bootstrap: core tables already exist — skipping synchronize.');
      return;
    }
  } finally {
    await client.end();
  }

  const distEntities = join(backendRoot, 'dist', '**', '*.entity.js');
  if (!existsSync(join(backendRoot, 'dist', 'main.js'))) {
    throw new Error('dist/ not found — run npm run build before bootstrap-schema');
  }

  console.log('Schema bootstrap: empty database — running TypeORM synchronize...');
  const dataSource = new DataSource({
    type: 'postgres',
    ...(process.env.DATABASE_URL
      ? { url: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST ?? 'localhost',
          port: Number(process.env.DB_PORT ?? 5432),
          username: process.env.DB_USERNAME ?? 'postgres',
          password: process.env.DB_PASSWORD ?? '',
          database: process.env.DB_NAME ?? 'booking_platform',
        }),
    entities: [distEntities],
    synchronize: true,
    logging: true,
  });

  await dataSource.initialize();
  await dataSource.destroy();

  const markClient = new pg.Client(connectionConfig());
  await markClient.connect();
  try {
    await markAllMigrationsApplied(markClient);
  } finally {
    await markClient.end();
  }

  console.log('Schema bootstrap: synchronize complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
