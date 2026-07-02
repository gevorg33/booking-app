#!/usr/bin/env node
/** Fail when app-adoption work touches the live AI command / assistant pipeline. */
import { spawnSync } from 'node:child_process';

const BASE = process.env.ADOPTION_AI_BASE_REF?.trim() || 'main';
const BASE_SHA = process.env.ADOPTION_AI_BASE_SHA?.trim() || '';

const ADOPTION_SURFACE_PREFIXES = [
  'consumer-app/',
  'provider-app/',
  'backend/src/modules/mobile-app/',
  'backend/src/common/utils/mobile-app-config.util.ts',
  'backend/src/modules/analytics/entities/app-event.entity.ts',
];

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
  const candidates = [
    BASE_SHA,
    BASE,
    `origin/${BASE}`,
    `refs/remotes/origin/${BASE}`,
  ].filter(Boolean);
  for (const ref of candidates) {
    const probe = spawnSync('git', ['rev-parse', '--verify', ref], {
      encoding: 'utf8',
    });
    if (probe.status === 0) return ref;
  }
  console.error(
    `✗ cannot resolve base ref "${BASE}" (tried ${candidates.join(', ')})`,
  );
  process.exit(1);
}

function isAdoptionSurface(path) {
  if (path.startsWith('scripts/mobile-')) return true;
  return ADOPTION_SURFACE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
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

const adoptionChanges = uniqueChanged.filter(isAdoptionSurface);
const protectedChanges = uniqueChanged.filter(isProtected);

if (adoptionChanges.length === 0) {
  console.log('✓ no adoption-surface files changed; skipping AI isolation check');
  process.exit(0);
}

const hasIntentionalAiModuleWork = uniqueChanged.some((path) =>
  path.startsWith('backend/src/modules/ai/'),
);
if (hasIntentionalAiModuleWork) {
  console.log(
    '✓ PR includes backend AI module changes; defer pipeline review to AI CI gates',
  );
  process.exit(0);
}

if (protectedChanges.length === 0) {
  console.log(
    `✓ adoption surfaces changed without touching AI pipeline (${adoptionChanges.length} files)`,
  );
  process.exit(0);
}

console.error('✗ app-adoption must not modify the AI command / assistant pipeline');
console.error(`  base: ${baseRef}`);
for (const file of protectedChanges) {
  console.error(`  - ${file}`);
}
process.exit(1);
