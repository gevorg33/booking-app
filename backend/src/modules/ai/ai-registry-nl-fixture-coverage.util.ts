import { createRequire } from 'node:module';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { getIntentIdsBySurface } from './ai-command-registry.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

const fixtureRequire = createRequire(__filename);

export const MIN_REGISTRY_NL_PROMPTS_PER_INTENT = 10;

export const REGISTRY_META_INTENTS = new Set([
  'unknown',
  'error',
  'security_blocked',
  'clarify',
  'compound_intent',
]);

const SURFACES: readonly CommandSurface[] = [
  'dashboard',
  'provider',
  'customer',
  'public',
];

const SURFACE_EXPECTED_ACTION_KEYS: ReadonlyArray<{
  surface: CommandSurface;
  key: string;
}> = [
  { surface: 'dashboard', key: 'dashboardExpectedAction' },
  { surface: 'provider', key: 'providerExpectedAction' },
  { surface: 'customer', key: 'customerExpectedAction' },
  { surface: 'public', key: 'publicExpectedAction' },
];

const SURFACE_COMPOUND_STEP_KEYS: ReadonlyArray<{
  surface: CommandSurface;
  key: string;
}> = [
  { surface: 'dashboard', key: 'dashboardCompoundSteps' },
  { surface: 'provider', key: 'providerCompoundSteps' },
  { surface: 'customer', key: 'customerCompoundSteps' },
  { surface: 'public', key: 'publicCompoundSteps' },
];

const FIXTURE_SCAN_ROOTS = [
  join(__dirname),
  join(__dirname, '../provider-mobile'),
  join(__dirname, '../public-booking'),
] as const;

const EXTRA_FIXTURE_MODULE_PATHS = [
  join(__dirname, 'similar-app-guide-prompts.generated'),
] as const;

const SKIP_EXPORT_NAME =
  /(_RULES|_IDS|_DOMAIN|_UNION|_SET|_MAP|_BY_|MIN_|MAX_|THRESHOLD)/;

export type RegistryNlFixtureBinding = {
  intent: string;
  surface: CommandSurface;
};

export type RegistryNlFixtureCoverageRow = {
  intent: string;
  surface: CommandSurface;
  count: number;
  meetsMinimum: boolean;
};

export type RegistryNlFixtureGapRow = RegistryNlFixtureCoverageRow & {
  deficit: number;
};

export type RegistryNlFixtureCoverageReport = {
  minimum: number;
  auditedIntentCount: number;
  coveredIntentSurfacePairs: number;
  gapCount: number;
  gaps: RegistryNlFixtureGapRow[];
  rows: RegistryNlFixtureCoverageRow[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function expandSurface(surface: string | undefined): CommandSurface[] {
  if (surface === 'both') return ['customer', 'public'];
  if (surface && SURFACES.includes(surface as CommandSurface)) {
    return [surface as CommandSurface];
  }
  return [];
}

function addBinding(
  bindings: RegistryNlFixtureBinding[],
  intent: string,
  surface: CommandSurface,
): void {
  if (!intent || REGISTRY_META_INTENTS.has(intent)) return;
  bindings.push({ intent, surface });
}

function addBindingsForSurface(
  bindings: RegistryNlFixtureBinding[],
  intents: readonly string[],
  surface: CommandSurface,
): void {
  for (const intent of intents) addBinding(bindings, intent, surface);
}

export function extractRegistryNlBindingsFromRow(
  row: Record<string, unknown>,
): RegistryNlFixtureBinding[] {
  const bindings: RegistryNlFixtureBinding[] = [];
  const declaredSurfaces = expandSurface(
    typeof row.surface === 'string' ? row.surface : undefined,
  );
  const fallbackSurface = declaredSurfaces[0] ?? 'dashboard';

  for (const { surface, key } of SURFACE_EXPECTED_ACTION_KEYS) {
    const value = row[key];
    if (typeof value === 'string') addBinding(bindings, value, surface);
  }

  if (typeof row.expectedAction === 'string') {
    for (const surface of declaredSurfaces.length > 0
      ? declaredSurfaces
      : [fallbackSurface]) {
      addBinding(bindings, row.expectedAction, surface);
    }
  }

  if (typeof row.action === 'string') {
    for (const surface of declaredSurfaces.length > 0
      ? declaredSurfaces
      : [fallbackSurface]) {
      addBinding(bindings, row.action, surface);
    }
  }

  for (const { surface, key } of SURFACE_COMPOUND_STEP_KEYS) {
    const steps = row[key];
    if (!Array.isArray(steps)) continue;
    for (const step of steps) {
      if (typeof step === 'string') addBinding(bindings, step, surface);
    }
  }

  for (const field of ['orderedActions', 'actions'] as const) {
    const steps = row[field];
    if (!Array.isArray(steps)) continue;
    for (const step of steps) {
      if (typeof step !== 'string') continue;
      for (const surface of declaredSurfaces.length > 0
        ? declaredSurfaces
        : [fallbackSurface]) {
        addBinding(bindings, step, surface);
      }
    }
  }

  return bindings;
}

export function isNlPromptFixtureRow(row: unknown): row is Record<string, unknown> {
  if (!isRecord(row)) return false;
  return typeof row.prompt === 'string' && row.prompt.trim().length > 0;
}

export function resolveNlPromptFixtureId(
  row: Record<string, unknown>,
  source: string,
  index: number,
): string {
  if (typeof row.id === 'string' && row.id.length > 0) return row.id;
  return `${source}#${index}`;
}

export function extractRegistryNlBindingsFromEvalCase(
  evalCase: AiCommandEvalCase,
): RegistryNlFixtureBinding[] {
  const bindings: RegistryNlFixtureBinding[] = [];
  const surfaces = expandSurface(evalCase.surface);
  const compoundSurface =
    typeof evalCase.expect.compoundSurface === 'string'
      ? expandSurface(evalCase.expect.compoundSurface)
      : [];
  const targetSurfaces =
    surfaces.length > 0
      ? surfaces
      : compoundSurface.length > 0
        ? compoundSurface
        : [];

  const intents = new Set<string>();
  for (const key of [
    'action',
    'rescuedAction',
    'enrichedAction',
    'semanticMatchAction',
    'validationAction',
  ] as const) {
    const value = evalCase.expect[key];
    if (typeof value === 'string') intents.add(value);
  }
  for (const step of evalCase.expect.compoundSteps ?? []) intents.add(step);
  for (const step of evalCase.expect.compoundActionsContains ?? []) {
    intents.add(step);
  }

  if (targetSurfaces.length === 0) {
    for (const intent of intents) {
      addBinding(bindings, intent, 'dashboard');
    }
    return bindings;
  }

  for (const intent of intents) {
    for (const surface of targetSurfaces) {
      addBinding(bindings, intent, surface);
    }
  }

  return bindings;
}

function listFixtureModulePaths(): string[] {
  const paths = new Set<string>(EXTRA_FIXTURE_MODULE_PATHS);

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        if (entry === 'node_modules' || entry === 'dist') continue;
        walk(fullPath);
        continue;
      }
      if (!entry.endsWith('.fixtures.ts')) continue;
      paths.add(fullPath.replace(/\.ts$/, ''));
    }
  }

  for (const root of FIXTURE_SCAN_ROOTS) walk(root);
  return [...paths].sort();
}

function shouldSkipExport(exportName: string, value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true;
  if (SKIP_EXPORT_NAME.test(exportName)) return true;
  if (exportName.endsWith('_RULES')) return true;
  return !value.some((row) => isNlPromptFixtureRow(row));
}

function loadFixtureModules(): Array<{
  source: string;
  exports: Record<string, unknown>;
}> {
  const modules: Array<{ source: string; exports: Record<string, unknown> }> =
    [];

  for (const modulePath of listFixtureModulePaths()) {
    try {
      const loaded = fixtureRequire(modulePath) as Record<string, unknown>;
      modules.push({
        source: relative(join(__dirname, '../..'), `${modulePath}.ts`),
        exports: loaded,
      });
    } catch {
      // Optional modules may be absent in partial workspaces.
    }
  }

  return modules;
}

function countKey(intent: string, surface: CommandSurface): string {
  return `${surface}:${intent}`;
}

export function countRegistryNlFixtures(
  evalCases: readonly AiCommandEvalCase[] = [],
  options: { includeFixtureModules?: boolean } = {},
): Map<string, number> {
  const includeFixtureModules = options.includeFixtureModules ?? true;
  const counts = new Map<string, number>();
  const seen = new Set<string>();

  const recordPrompt = (
    bindings: readonly RegistryNlFixtureBinding[],
    promptId: string,
  ): void => {
    for (const binding of bindings) {
      const key = countKey(binding.intent, binding.surface);
      const dedupeKey = `${key}:${promptId}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  };

  if (includeFixtureModules) {
    for (const { source, exports } of loadFixtureModules()) {
      for (const [exportName, value] of Object.entries(exports)) {
        if (shouldSkipExport(exportName, value)) continue;
        const rows = value as unknown[];
        rows.forEach((row, index) => {
          if (!isNlPromptFixtureRow(row)) return;
          const promptId = resolveNlPromptFixtureId(
            row,
            `${source}#${exportName}`,
            index,
          );
          recordPrompt(extractRegistryNlBindingsFromRow(row), promptId);
        });
      }
    }
  }

  for (const evalCase of evalCases) {
    if (typeof evalCase.prompt !== 'string' || evalCase.prompt.trim() === '') {
      continue;
    }
    recordPrompt(
      extractRegistryNlBindingsFromEvalCase(evalCase),
      `eval:${evalCase.id}`,
    );
  }

  return counts;
}

export function registryIntentsForSurface(
  surface: CommandSurface,
): readonly string[] {
  switch (surface) {
    case 'dashboard':
      return DASHBOARD_INTENTS;
    case 'provider':
      return PROVIDER_INTENTS;
    case 'customer':
      return CUSTOMER_INTENTS;
    case 'public':
      return PUBLIC_INTENTS;
    default:
      return getIntentIdsBySurface(surface);
  }
}

export function auditRegistryNlFixtureCoverage(
  evalCases: readonly AiCommandEvalCase[] = [],
  minimum = MIN_REGISTRY_NL_PROMPTS_PER_INTENT,
): RegistryNlFixtureCoverageReport {
  const counts = countRegistryNlFixtures(evalCases);
  const rows: RegistryNlFixtureCoverageRow[] = [];

  for (const surface of SURFACES) {
    for (const intent of registryIntentsForSurface(surface)) {
      if (REGISTRY_META_INTENTS.has(intent)) continue;
      const count = counts.get(countKey(intent, surface)) ?? 0;
      rows.push({
        intent,
        surface,
        count,
        meetsMinimum: count >= minimum,
      });
    }
  }

  rows.sort((left, right) => {
    if (left.surface !== right.surface) {
      return left.surface.localeCompare(right.surface);
    }
    if (left.count !== right.count) return left.count - right.count;
    return left.intent.localeCompare(right.intent);
  });

  const gaps = rows
    .filter((row) => !row.meetsMinimum)
    .map((row) => ({
      ...row,
      deficit: minimum - row.count,
    }));

  return {
    minimum,
    auditedIntentCount: rows.length,
    coveredIntentSurfacePairs: rows.filter((row) => row.count > 0).length,
    gapCount: gaps.length,
    gaps,
    rows,
  };
}

export function listRegistryNlFixtureGaps(
  evalCases: readonly AiCommandEvalCase[] = [],
  minimum = MIN_REGISTRY_NL_PROMPTS_PER_INTENT,
): RegistryNlFixtureGapRow[] {
  return auditRegistryNlFixtureCoverage(evalCases, minimum).gaps;
}

export function formatRegistryNlFixtureCoverageReport(
  report: RegistryNlFixtureCoverageReport,
): string {
  const lines: string[] = [
    `Registry NL fixture coverage (ai-cmd-ext-6.4 / ai-cmd-ext-gap-5)`,
    `Minimum prompts per intent/surface: ${report.minimum}`,
    `Audited intent/surface pairs: ${report.auditedIntentCount}`,
    `Pairs with ≥${report.minimum} prompts: ${
      report.auditedIntentCount - report.gapCount
    }`,
    `Pairs below minimum: ${report.gapCount}`,
    '',
  ];

  for (const surface of SURFACES) {
    const surfaceGaps = report.gaps.filter((gap) => gap.surface === surface);
    lines.push(
      `${surface}: ${surfaceGaps.length} intents below ${report.minimum}`,
    );
    for (const gap of surfaceGaps.slice(0, 25)) {
      lines.push(`  - ${gap.intent}: ${gap.count} (need +${gap.deficit})`);
    }
    if (surfaceGaps.length > 25) {
      lines.push(`  … +${surfaceGaps.length - 25} more`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function listGatedRegistryNlFixtureViolations(
  evalCases: readonly AiCommandEvalCase[],
  gated: ReadonlyArray<{ intent: string; surface: CommandSurface }>,
  minimum = MIN_REGISTRY_NL_PROMPTS_PER_INTENT,
): string[] {
  const counts = countRegistryNlFixtures(evalCases);
  const violations: string[] = [];

  for (const row of gated) {
    const count = counts.get(countKey(row.intent, row.surface)) ?? 0;
    if (count < minimum) {
      violations.push(
        `${row.surface}:${row.intent}: ${count}/${minimum} NL fixtures`,
      );
    }
  }

  return violations;
}
