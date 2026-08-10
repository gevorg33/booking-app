#!/usr/bin/env node
/**
 * AI-ROADMAP Phase 2 — "make red mean red".
 *
 * The AI module's test sweep has failed for months. A suite that is always red
 * carries no information: proving a change is safe currently means stashing it,
 * running the sweep, restoring, running again, and diffing the failure lists by
 * hand. That has been done three times on this programme (§20, §23, §24) and it
 * is not a process anyone will follow under time pressure.
 *
 * This turns that manual diff into a gate. Every known failure is listed in
 * `ai-known-failures.json` with a reason. The gate runs the sweep and compares:
 *
 *   - a failure NOT in the manifest  → something this change broke. Red = red.
 *   - a manifest entry that now PASSES → fixed; remove it. The list only shrinks.
 *
 * The second rule is what stops the manifest becoming a dumping ground: you
 * cannot quarantine a test and forget it, because fixing it fails the gate until
 * the entry is deleted.
 *
 * Usage:
 *   node scripts/ai-known-failures-gate.mjs            # gate
 *   node scripts/ai-known-failures-gate.mjs --update   # rewrite the manifest
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'backend');
const MANIFEST_PATH = path.join(
  backend,
  'src',
  'modules',
  'ai',
  'ai-known-failures.json',
);
/**
 * e2e-bug.421 — `provider-mobile` is in scope too.
 *
 * The pattern was `modules/ai/`, so a whole directory of AI surface code sat
 * outside "red means red": `provider-mobile` had 11 failing tests that no gate
 * reported, and verifying a change there meant reversing the edit by hand and
 * re-running (§144). All 11 were fixed in §145 — 10 of them tests that had
 * rotted against the calendar rather than against any code — so this widens the
 * net without importing a single accepted failure.
 */
const TEST_PATTERN =
  process.env.AI_FAILURES_PATTERN ?? 'modules/(ai|provider-mobile)/';

const update = process.argv.includes('--update');

/** Run the AI sweep and return jest's structured results. */
function runSweep() {
  const outFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'ai-sweep-')),
    'results.json',
  );
  const jest = path.join(backend, 'node_modules', '.bin', 'jest');
  const res = spawnSync(
    jest,
    [
      // Deliberately NOT --runInBand: CI runs `npm test` with jest's default
      // parallelism, and a manifest built under different scheduling would
      // quarantine a different set of tests than CI actually sees.
      '--silent',
      `--testPathPatterns=${TEST_PATTERN}`,
      '--json',
      `--outputFile=${outFile}`,
    ],
    { cwd: backend, stdio: 'inherit', env: process.env },
  );
  if (!fs.existsSync(outFile)) {
    console.error(
      `\nSweep produced no results file (jest exit ${res.status}). Cannot gate.`,
    );
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  fs.rmSync(path.dirname(outFile), { recursive: true, force: true });
  return parsed;
}

/**
 * Failing tests keyed by repo-relative suite path.
 *
 * A suite that fails to even load (import error, TS error) reports zero test
 * results, so it is recorded with the sentinel `*` — otherwise the worst kind of
 * breakage, a file that cannot compile, would look like a clean suite.
 */
function collectFailures(results) {
  const failures = {};
  for (const suite of results.testResults ?? []) {
    const rel = path.relative(backend, suite.name).split(path.sep).join('/');
    const failed = (suite.assertionResults ?? [])
      .filter((a) => a.status === 'failed')
      .map((a) => a.fullName)
      .sort();
    const suiteFailedToRun =
      failed.length === 0 &&
      (suite.status === 'failed' ||
        (suite.message ?? '').trim().length > 0) &&
      (suite.assertionResults ?? []).length === 0;
    if (suiteFailedToRun) failures[rel] = ['*'];
    else if (failed.length) failures[rel] = failed;
  }
  return failures;
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function main() {
  // Check the prerequisite BEFORE the sweep. The sweep costs tens of minutes,
  // and discovering a missing manifest afterwards wastes all of it.
  const manifestUpFront = loadManifest();
  if (!update && !manifestUpFront) {
    console.error(
      'No known-failures manifest at\n  ' +
        MANIFEST_PATH +
        '\nRun `npm run test:ai-known-failures:update` and commit the result.\n' +
        'Note: the sweep runs the whole modules/ai suite and takes tens of minutes.',
    );
    return 1;
  }

  const results = runSweep();
  const actual = collectFailures(results);
  const actualCount = Object.values(actual).reduce((n, t) => n + t.length, 0);

  if (update) {
    const manifest = {
      $comment:
        'AI-ROADMAP Phase 2 — known-failing AI tests. Generated by `npm run test:ai-known-failures:update`. Entries may only be REMOVED (by fixing the test); adding one is a deliberate act that needs a reason and a ticket.',
      generatedAt: new Date().toISOString(),
      suiteCount: Object.keys(actual).length,
      testCount: actualCount,
      reasons: (loadManifest() ?? {}).reasons ?? {},
      failures: Object.fromEntries(
        Object.keys(actual)
          .sort()
          .map((k) => [k, actual[k]]),
      ),
    };
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(
      `\nWrote ${MANIFEST_PATH}\n  ${manifest.suiteCount} suites, ${manifest.testCount} failing tests.`,
    );
    return 0;
  }

  const manifest = manifestUpFront;
  const known = manifest.failures ?? {};
  const newFailures = [];
  const fixed = [];

  for (const [suite, tests] of Object.entries(actual)) {
    const knownTests = new Set(known[suite] ?? []);
    if (knownTests.has('*')) continue; // whole suite already quarantined
    for (const t of tests) {
      if (!knownTests.has(t)) newFailures.push(`${suite} › ${t}`);
    }
  }

  for (const [suite, tests] of Object.entries(known)) {
    const actualTests = new Set(actual[suite] ?? []);
    for (const t of tests) {
      if (!actualTests.has(t)) fixed.push(`${suite} › ${t}`);
    }
  }

  console.log(
    `\n[AI-ROADMAP red-means-red] ${Object.keys(actual).length} failing suites · ` +
      `${actualCount} failing tests · manifest ${manifest.testCount}`,
  );

  if (newFailures.length) {
    console.error(
      `\n✗ ${newFailures.length} failure(s) NOT in the manifest — this change broke them:`,
    );
    for (const f of newFailures.slice(0, 40)) console.error(`    ${f}`);
    if (newFailures.length > 40) {
      console.error(`    … and ${newFailures.length - 40} more`);
    }
  }

  if (fixed.length) {
    console.error(
      `\n✗ ${fixed.length} manifest entr(ies) now PASS. Remove them — the list only shrinks:`,
    );
    for (const f of fixed.slice(0, 40)) console.error(`    ${f}`);
    if (fixed.length > 40) console.error(`    … and ${fixed.length - 40} more`);
    console.error('\n    Run `npm run test:ai-known-failures:update`.');
  }

  if (!newFailures.length && !fixed.length) {
    console.log('✓ Failure set matches the manifest exactly.');
    return 0;
  }
  return 1;
}

process.exit(main());
