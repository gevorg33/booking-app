#!/usr/bin/env node
/**
 * AI-ROADMAP Phase 9 — the completion half of "ratcheting accuracy + completion
 * floors".
 *
 * Accuracy already ratchets in CI (§25) because it is measured against a fixed
 * corpus. Completion cannot: it is measured against live traffic, so it belongs
 * in a scheduled job with database access, not in a pull-request gate. Wiring it
 * into CI would either need a production database from every branch build, or a
 * fixture — and a floor checked against a fixture measures nothing.
 *
 * So this is a cron-shaped gate. It reads the §28 aggregate views, checks them
 * against the committed floors, and exits non-zero on a breach.
 *
 *   node scripts/ai-completion-floor-gate.mjs            # check
 *   node scripts/ai-completion-floor-gate.mjs --update   # ratchet floors up
 *
 * `--update` can only raise. Lowering a floor means editing the committed JSON
 * by hand, which shows up in review — the point of a ratchet is that giving
 * ground is a decision somebody signs, not a side effect of a scheduled run.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'backend');

// `pg` is a backend dependency and this script sits at the repo root, where a
// bare `import 'pg'` does not resolve.
const { Client } = createRequire(path.join(backend, 'package.json'))('pg');
const FLOORS_PATH = path.join(
  backend,
  'src',
  'modules',
  'ai',
  'ai-completion-floors.json',
);

const update = process.argv.includes('--update');

/**
 * The floor rules, duplicated from `ai-completion-floor.util.ts`.
 *
 * This script is plain ESM and the util is TypeScript; importing it would mean
 * a build step in a cron job. The duplication is deliberate and small, and
 * `ai-completion-floor.gate.spec.ts` asserts the two agree — so a drift fails a
 * test rather than silently changing what the gate enforces.
 */
const MARGIN = 2;
const MIN_CALLS = 200;

const floorFrom = (rate) => Math.max(0, Math.floor((rate - MARGIN) * 10) / 10);

function loadEnv() {
  const envPath = path.join(backend, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

async function measure() {
  loadEnv();
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    const overall = await client.query(
      'SELECT calls, completion_rate FROM ai_command_completion_summary',
    );
    const surfaces = await client.query(
      'SELECT surface, calls, completion_rate FROM ai_command_completion_by_surface',
    );
    return {
      overall: {
        calls: Number(overall.rows[0]?.calls ?? 0),
        completionRate: Number(overall.rows[0]?.completion_rate ?? 0),
      },
      bySurface: surfaces.rows.map((r) => ({
        surface: r.surface,
        calls: Number(r.calls),
        completionRate: Number(r.completion_rate),
      })),
    };
  } finally {
    await client.end();
  }
}

function check(report, floors) {
  const breaches = [];
  const skipped = [];

  if (report.overall.calls < MIN_CALLS) {
    skipped.push(`overall (${report.overall.calls} calls)`);
  } else if (report.overall.completionRate < floors.overall) {
    breaches.push(
      `overall ${report.overall.completionRate}% < ${floors.overall}% floor ` +
        `(${report.overall.calls} calls)`,
    );
  }

  for (const [surface, floor] of Object.entries(floors.bySurface)) {
    const measured = report.bySurface.find((s) => s.surface === surface);
    if (!measured) continue;
    if (measured.calls < MIN_CALLS) {
      skipped.push(`${surface} (${measured.calls} calls)`);
      continue;
    }
    if (measured.completionRate < floor) {
      breaches.push(
        `${surface} ${measured.completionRate}% < ${floor}% floor ` +
          `(${measured.calls} calls)`,
      );
    }
  }
  return { breaches, skipped };
}

function raise(current, report) {
  const raised = [];
  const next = {
    ...current,
    bySurface: { ...current.bySurface },
    generatedAt: new Date().toISOString(),
  };

  const proposedOverall = floorFrom(report.overall.completionRate);
  if (proposedOverall > current.overall) {
    raised.push(`overall ${current.overall}% → ${proposedOverall}%`);
    next.overall = proposedOverall;
  }

  for (const s of report.bySurface) {
    if (s.calls < MIN_CALLS) continue;
    const proposed = floorFrom(s.completionRate);
    const existing = current.bySurface[s.surface];
    if (existing === undefined || proposed > existing) {
      raised.push(`${s.surface} ${existing ?? 0}% → ${proposed}%`);
      next.bySurface[s.surface] = proposed;
    }
  }
  return { next, raised };
}

async function main() {
  if (!fs.existsSync(FLOORS_PATH)) {
    console.error(`No floors file at ${FLOORS_PATH}.`);
    process.exit(1);
  }
  const floors = JSON.parse(fs.readFileSync(FLOORS_PATH, 'utf8'));

  let report;
  try {
    report = await measure();
  } catch (error) {
    // A cron job that cannot reach the database has not proved the floors hold.
    console.error(`Could not measure completion: ${error.message}`);
    process.exit(1);
  }

  console.log(
    `overall ${report.overall.completionRate}% of ${report.overall.calls} calls ` +
      `(floor ${floors.overall}%)`,
  );
  for (const s of report.bySurface) {
    const floor = floors.bySurface[s.surface];
    console.log(
      `  ${s.surface.padEnd(10)} ${String(s.completionRate).padStart(5)}% of ` +
        `${String(s.calls).padStart(5)} calls (floor ${floor ?? 'none'})`,
    );
  }

  if (update) {
    const { next, raised } = raise(floors, report);
    if (raised.length === 0) {
      console.log('\nNo floor improved. Floors unchanged.');
      return;
    }
    fs.writeFileSync(FLOORS_PATH, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`\nRatcheted ${raised.length} floor(s):`);
    for (const r of raised) console.log(`  ${r}`);
    return;
  }

  const { breaches, skipped } = check(report, floors);
  for (const s of skipped) {
    console.log(`\nSkipped, too little traffic to judge: ${s}`);
  }
  if (breaches.length > 0) {
    console.error(`\nCompletion floor breached:`);
    for (const b of breaches) console.error(`  ${b}`);
    process.exit(1);
  }
  console.log('\nAll completion floors hold.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
