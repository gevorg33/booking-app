#!/bin/sh
set -eu

# Railway / Render often expose DATABASE_URL and REDIS_URL — map to app env vars.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_HOST:-}" ]; then
  eval "$(node -e "
    const u = new URL(process.env.DATABASE_URL);
    const q = (v) => JSON.stringify(v);
    console.log('export DB_HOST=' + q(u.hostname));
    console.log('export DB_PORT=' + q(u.port || '5432'));
    console.log('export DB_USERNAME=' + q(decodeURIComponent(u.username || 'postgres')));
    console.log('export DB_PASSWORD=' + q(decodeURIComponent(u.password || '')));
    console.log('export DB_NAME=' + q(u.pathname.replace(/^\\//, '') || 'booking_platform'));
  ")"
fi

if [ -n "${REDIS_URL:-}" ] && [ -z "${REDIS_HOST:-}" ]; then
  eval "$(node -e "
    const u = new URL(process.env.REDIS_URL);
    const q = (v) => JSON.stringify(v);
    console.log('export REDIS_HOST=' + q(u.hostname));
    console.log('export REDIS_PORT=' + q(u.port || '6379'));
  ")"
fi

echo "Bootstrapping database schema (fresh DB only)..."
node scripts/bootstrap-schema.mjs

echo "Running database migrations..."
node scripts/run-migrations.mjs

echo "Starting NestJS API on port ${PORT:-3001}..."
exec node dist/main
