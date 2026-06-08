#!/usr/bin/env node
/** Fail when app-adoption work touches the live AI command / assistant pipeline. */
import { spawnSync } from 'node:child_process';

const BASE = process.env.ADOPTION_AI_BASE_REF?.trim() || 'main';

const PROTECTED_PREFIXES = [
  'backend/src/modules/ai/',
  'backend/src/modules/public-booking/public-booking-assistant.service.ts',
  'backend/src/modules/public-booking/public-booking-assistant.schema.spec.ts',
  'backend/src/modules/public-booking/public-booking-assistant.locale-dates.spec.ts',
  'backend/src/engine/agent/',
];

const PROTECTED_EXACT = new Set([
  'backend/scripts/ai-accuracy-gate.mjs',
  'backend/scripts/ai-n99-clarify-gate.mjs',
  'backend/scripts/ai-n99-no-clarify-gate.mjs',
  'backend/scripts/ai-llm-eval-nightly.mjs',
  'backend/scripts/parity-exit-gate.mjs',
  'backend/scripts/parity-coverage-ratchet.mjs',
  '.github/workflows/ai-accuracy-gate.yml',
  '.github/workflows/ai-llm-eval-nightly.yml',
]);

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || `git ${args.join(' ')} failed`);
    process.exit(result.status ?? 1);
  }
  return (result.stdout || '').trim();
}

function resolveBase() {
  const refs = [BASE, `origin/${BASE}`];
  for (const ref of refs) {
    const probe = spawnSync('git', ['rev-parse', '--verify', ref], {
      encoding: 'utf8',
    });
    if (probe.status === 0) return ref;
  }
  console.error(`✗ cannot resolve base ref "${BASE}" (tried ${refs.join(', ')})`);
  process.exit(1);
}

function isProtected(path) {
  if (PROTECTED_EXACT.has(path)) return true;
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

const baseRef = resolveBase();
const changed = [
  ...git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n'),
  ...git(['diff', '--name-only', baseRef]).split('\n'),
  ...git(['diff', '--name-only', '--cached', baseRef]).split('\n'),
]
  .map((line) => line.trim())
  .filter(Boolean);
const uniqueChanged = [...new Set(changed)];

const violations = uniqueChanged.filter(isProtected);
if (violations.length > 0) {
  console.error('✗ app-adoption must not modify the AI command / assistant pipeline');
  console.error(`  base: ${baseRef}`);
  for (const file of violations) {
    console.error(`  - ${file}`);
  }
  process.exit(1);
}

console.log(
  `✓ AI pipeline unchanged vs ${baseRef} (${uniqueChanged.length} adoption files differ)`,
);
