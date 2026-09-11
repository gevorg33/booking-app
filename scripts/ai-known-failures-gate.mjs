#!/usr/bin/env node
/**
 * AI-ROADMAP Phase 2 — "make red mean red".
 *
 * Now covers the whole backend, not just the AI modules (§205).
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
/**
 * e2e-bug.471 / §205 — the rest of the backend is in scope too.
 *
 * The same argument as e2e-bug.421 one level up: everything outside
 * `modules/(ai|provider-mobile)/` sat outside "red means red", and CI's own
 * `npm test` runs the whole backend, so the gate covered a strict subset of
 * what CI actually fails on. Measured 2026-08-17: **89 failing tests in 21
 * suites** that no manifest tracked, next to an AI manifest that looked
 * authoritative.
 *
 * Widened only after triaging them (§193-§204): 80 were stale fixtures and were
 * fixed rather than absorbed, so this imports **9** accepted failures, not 89.
 * That ordering is the whole point — widening first would have written 80 stale
 * fixtures into the manifest as expected behaviour, which is precisely the
 * dumping ground the second rule above exists to prevent.
 */
const TEST_PATTERN = process.env.AI_FAILURES_PATTERN ?? 'src/';

const update = process.argv.includes('--update');
// e2e-bug.498 — `--update` is removal-only unless this is passed. See the
// refusal below for why the default had to change.
const allowNew = process.argv.includes('--allow-new');

/**
 * F1 / e2e-bug.359 — shard support.
 *
 * The sweep is the long pole of CI (~11 min over 1,928 suites). Sharding it is
 * not a matter of passing `--shard` through, because this gate compares the
 * failure set against the manifest **exactly, in both directions**: a shard
 * sees only its slice, so every *other* shard's known failures look like
 * silent fixes. A partial set can never be compared against a whole-run
 * manifest.
 *
 * So the run and the comparison are separated:
 *
 *   --shard=i/N --out=FILE   run one slice, write its failure map, exit 0
 *   --merge=DIR              union every *.json in DIR, then compare as usual
 *
 * Merging is a plain object merge because **jest shards by test file**, so no
 * suite can appear in two slices and the maps are disjoint by construction.
 * `assertDisjoint` below checks that rather than trusting it — if jest ever
 * changes, a silently dropped suite would look like a fix.
 */
const argOf = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const shard = argOf('shard');
const outFileArg = argOf('out');
const mergeDir = argOf('merge');

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
      // Deliberately NOT --runInBand. The manifest records which tests fail
      // under jest's *default* parallelism; rebuilding it serially would
      // quarantine a different set than this sweep then observes, and the
      // comparison is exact in both directions. (Until 2026-08-25 this was
      // phrased as matching what CI's `npm test` produced — that job was
      // retired in e2e-bug.449 because it could never pass, and this sweep is
      // now the thing CI runs. The requirement is unchanged; only its reference
      // point is.)
      '--silent',
      `--testPathPatterns=${TEST_PATTERN}`,
      ...(shard ? [`--shard=${shard}`] : []),
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
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  // --update rewrites both counts from the list it just measured, so it is the
  // repair path this check points people at. Refusing to run it on a drifted
  // header would make that advice a dead end.
  if (!update) assertManifestCountsAgree(manifest);
  return manifest;
}

/**
 * e2e-bug.507 — the header must describe the list underneath it.
 *
 * `suiteCount` / `testCount` are written by `--update` and then printed in the
 * verdict line, but nothing used to check them against `failures`. The set
 * comparison below never reads them, so drift could not let a regression
 * through — it could only make the gate report a number that disagreed with
 * the result it printed one line later ("90 failing tests · manifest 91"
 * directly above "failure set matches the manifest exactly"). A reader then has
 * to know which of the two is load-bearing.
 *
 * Drift only happens by hand-editing, which is exactly how entries are removed
 * when a test is fixed, so this fails rather than self-corrects: silently
 * rewriting the header would hide a half-finished edit in the one file whose
 * whole purpose is to be an honest ledger.
 */
function assertManifestCountsAgree(manifest) {
  const failures = manifest?.failures;
  if (!failures || typeof failures !== 'object') return;
  const suites = Object.keys(failures).length;
  const tests = Object.values(failures).reduce(
    (n, list) => n + (Array.isArray(list) ? list.length : 0),
    0,
  );
  const wrong = [];
  if (manifest.suiteCount !== suites) {
    wrong.push(`suiteCount says ${manifest.suiteCount}, list has ${suites}`);
  }
  if (manifest.testCount !== tests) {
    wrong.push(`testCount says ${manifest.testCount}, list has ${tests}`);
  }
  if (!wrong.length) return;
  console.error(
    `\n\u2717 ${MANIFEST_PATH} header disagrees with its own failure list:\n` +
      wrong.map((w) => `    ${w}`).join('\n') +
      '\n\nThis is a hand-edit that was not finished. Correct the header to ' +
      'match the list\n(or regenerate with ' +
      '`npm run test:ai-known-failures:update`) and re-run.\n',
  );
  process.exit(1);
}

/**
 * Union the per-shard failure maps.
 *
 * Jest shards by test file, so the maps are disjoint and a plain merge is
 * correct. That is asserted rather than assumed: a suite appearing twice would
 * mean the slices overlap, and silently keeping one copy could drop failures
 * that the manifest expects — which this gate would then report as fixes.
 */
function mergeShardFiles(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (!files.length) {
    console.error(`\nNo shard result files in ${dir}. Cannot gate.`);
    process.exit(1);
  }
  const merged = {};
  const seenIn = {};
  let shardsSeen = 0;
  for (const f of files) {
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const failures = parsed.failures ?? {};
    shardsSeen += 1;
    for (const [suite, tests] of Object.entries(failures)) {
      if (suite in merged) {
        console.error(
          `\nSuite reported by two shards: ${suite}` +
            `\n  first in ${seenIn[suite]}, again in ${f}` +
            '\nShards must partition test files. Cannot gate.',
        );
        process.exit(1);
      }
      merged[suite] = tests;
      seenIn[suite] = f;
    }
  }
  // Every declared shard must have reported. A missing slice looks exactly like
  // "those tests now pass", which is the failure mode this gate exists to catch.
  const expected = Number(declaredShardTotal(files, dir));
  if (expected && shardsSeen !== expected) {
    console.error(
      `\nExpected ${expected} shard files, found ${shardsSeen}. ` +
        'A missing shard reads as a set of silent fixes. Cannot gate.',
    );
    process.exit(1);
  }
  console.log(`\nMerged ${shardsSeen} shard result file(s) from ${dir}.`);
  return merged;
}

/** The `total` recorded by the shards; they must agree. */
function declaredShardTotal(files, dir) {
  const totals = new Set(
    files.map(
      (f) =>
        JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).shardTotal ?? 0,
    ),
  );
  if (totals.size > 1) {
    console.error(
      `\nShard files disagree on the shard count: ${[...totals].join(', ')}. Cannot gate.`,
    );
    process.exit(1);
  }
  return [...totals][0] ?? 0;
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

  // --shard=i/N --out=FILE : run one slice and record it. No comparison here —
  // a slice cannot be judged against a whole-run manifest.
  if (shard) {
    if (!outFileArg) {
      console.error('\n--shard requires --out=FILE to write the slice to.');
      return 1;
    }
    const sliceFailures = collectFailures(runSweep());
    const total = Number(shard.split('/')[1] ?? 0);
    fs.mkdirSync(path.dirname(outFileArg), { recursive: true });
    fs.writeFileSync(
      outFileArg,
      `${JSON.stringify({ shard, shardTotal: total, failures: sliceFailures }, null, 2)}\n`,
    );
    const n = Object.values(sliceFailures).reduce((a, t) => a + t.length, 0);
    console.log(
      `\nShard ${shard}: ${Object.keys(sliceFailures).length} failing suites · ${n} failing tests` +
        `\nWrote ${outFileArg}`,
    );
    return 0;
  }

  const actual = mergeDir ? mergeShardFiles(mergeDir) : collectFailures(runSweep());
  const actualCount = Object.values(actual).reduce((n, t) => n + t.length, 0);

  if (update && mergeDir) {
    console.error(
      '\n--update from merged shards is refused: the manifest is the ' +
        'authority for the whole suite, and rewriting it from slices makes a ' +
        'missing shard look like a set of fixes. Run the full sweep to update.',
    );
    return 1;
  }

  if (update && !allowNew) {
    // e2e-bug.498 — refuse to ADD entries.
    //
    // The manifest's own `$comment` has always said "Entries may only be
    // REMOVED; adding one is a deliberate act that needs a reason and a
    // ticket." Nothing enforced it: `--update` rewrote the file from one
    // sweep, so any suite that merely *flaked* during that sweep became an
    // accepted failure permanently — and undetectably, because the manifest
    // then matched on every later run.
    //
    // That is strictly worse than the flake risk in `e2e-bug.474`. There, a
    // flake turns the gate red: noisy, but it tells you. Here it turns the
    // gate green and wrong.
    //
    // Observed 2026-08-21: an update recording 47 genuine fixes also absorbed
    // **11 unrelated integration suites**, each as a whole-suite `*`, every one
    // of which passed in isolation moments later.
    const prev = loadManifest();
    if (prev?.failures) {
      const added = [];
      for (const [suite, tests] of Object.entries(actual)) {
        const before = new Set(prev.failures[suite] ?? []);
        for (const t of tests) {
          if (!before.has(t)) added.push(`${suite} \u203a ${t}`);
        }
      }
      if (added.length) {
        console.error(
          `\n--update refused: it would ADD ${added.length} entr(ies) to the ` +
            'manifest, and the manifest may only shrink.\n\n' +
            added
              .slice(0, 20)
              .map((a) => `    + ${a}`)
              .join('\n') +
            (added.length > 20 ? `\n    … and ${added.length - 20} more` : '') +
            '\n\nMost often these are flakes under load, not regressions — run the ' +
            'named suites on their own first.\n' +
            'If they are genuinely newly-accepted failures, that needs a reason ' +
            'and a ticket, then re-run with --allow-new.\n',
        );
        return 1;
      }
    }
  }

  if (update) {
    const manifest = {
      $comment:
        'AI-ROADMAP Phase 2 — known-failing backend tests (whole of src/, widened from the AI modules in §205). Generated by `npm run test:ai-known-failures:update`. Entries may only be REMOVED (by fixing the test); adding one is a deliberate act that needs a reason and a ticket.',
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
