#!/usr/bin/env node
/**
 * e2e-bug.454 — the lint ratchet.
 *
 * Lint was not enforced anywhere: `eslint src` reported thousands of errors and
 * nothing failed, so a ticket about *six* of them could not mean anything. The
 * ticket's own framing was "either lint gets a gate and a baseline, or this
 * closes as superseded". This is the gate.
 *
 * ## Why a ratchet and not a clean-up
 *
 * Measured 2026-09-11: **5,854 errors across 4,563 files — and 5,031 of them
 * (86%) are `prettier/prettier`**, with 5,184 auto-fixable. So the number is
 * overwhelmingly unformatted code rather than defects, and `npm run lint`
 * (which passes `--fix`) would collapse most of it in one pass.
 *
 * That pass is deliberately **not** run here. It would rewrite 4,563 files,
 * which conflicts with anything else in flight, buries the next reviewer, and
 * scatters `git blame` across the whole tree. Collapsing the number is a
 * one-commit job for a moment when nobody else is mid-change — this gate's job
 * is to stop it growing in the meantime, which is the thing that has never been
 * true.
 *
 * Modelled on the known-failures manifest and the detector-freeze ratchet: the
 * baseline may only shrink, and a run that *improves* on it fails too, so the
 * number cannot silently drift upward later from a stale record.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(root, 'backend');
const BASELINE_PATH = path.join(root, 'scripts', 'lint-baseline.json');

const update = process.argv.includes('--update');

function runEslint() {
  const eslint = path.join(backend, 'node_modules', '.bin', 'eslint');
  let raw;
  try {
    raw = execFileSync(eslint, ['src', '--format', 'json'], {
      cwd: backend,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (err) {
    // eslint exits non-zero when there are errors, which is the normal case
    // here. Its stdout is still the report.
    raw = err.stdout;
    if (!raw) {
      console.error(`\neslint produced no report: ${err.message}`);
      process.exit(1);
    }
  }
  const files = JSON.parse(raw);
  return {
    errors: files.reduce((n, f) => n + f.errorCount, 0),
    warnings: files.reduce((n, f) => n + f.warningCount, 0),
    files: files.length,
  };
}

const actual = runEslint();

if (update) {
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(
      {
        _comment:
          'e2e-bug.454 lint ratchet. Errors may only DECREASE. Regenerate with `node scripts/lint-ratchet.mjs --update` and say why in the commit.',
        measuredAt: new Date().toISOString(),
        ...actual,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `\nWrote ${BASELINE_PATH}\n  ${actual.errors} errors, ${actual.warnings} warnings across ${actual.files} files.`,
  );
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error(
    `\nNo lint baseline at\n  ${BASELINE_PATH}\nRun \`node scripts/lint-ratchet.mjs --update\` and commit it.`,
  );
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));

console.log(
  `\n[lint ratchet] ${actual.errors} errors · baseline ${baseline.errors} ` +
    `(${actual.warnings} warnings, not gated)`,
);

if (actual.errors > baseline.errors) {
  console.error(
    `\n✗ Lint errors grew: ${baseline.errors} → ${actual.errors} (+${
      actual.errors - baseline.errors
    }).\n\n` +
      'Most errors in this tree are `prettier/prettier` and auto-fixable, so the\n' +
      'fix is usually `npm run lint` in backend/ on the files you touched.\n' +
      'The baseline may only shrink; raising it needs a reason and a ticket.\n',
  );
  process.exit(1);
}

if (actual.errors < baseline.errors) {
  console.error(
    `\n✗ Lint errors fell: ${baseline.errors} → ${actual.errors} (-${
      baseline.errors - actual.errors
    }). Lower the baseline.\n\n` +
      'Refused rather than congratulated, for the same reason the known-failures\n' +
      'manifest refuses it: a baseline left above the real number is slack the\n' +
      'gate cannot see through, and the next regression hides inside it.\n' +
      'Run `node scripts/lint-ratchet.mjs --update`.\n',
  );
  process.exit(1);
}

console.log('✓ Lint error count matches the baseline exactly.\n');
