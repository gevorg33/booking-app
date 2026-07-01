import type { CommandSurface } from './ai-command-registry.types.js';
import {
  type ImplicationCorpusScenario,
  type ImplicationTopIntent,
} from './ai-implication-corpus.fixtures.js';
import { CANONICAL_PHRASING_BANK } from './intent-phrasing.bank.js';

/** pipe-1.12.5 — per-surface implication eval parity (dashboard | customer | public | provider). */
export const IMPLICATION_CORPUS_SURFACE_PIPE_MARKER = 'pipe-1.12.5';

export const IMPLICATION_EVAL_SURFACES: readonly CommandSurface[] = [
  'dashboard',
  'provider',
  'customer',
  'public',
];

export const IMPLICATION_SEMANTIC_SURFACES: readonly CommandSurface[] = [
  'dashboard',
  'customer',
  'public',
];

export const MIN_IMPLICATION_PROMPTS_PER_SURFACE_INTENT = 10;

/** Top intents exercised on each eval surface (schedule is dashboard-only for semantic). */
export const IMPLICATION_SURFACE_TOP_INTENTS: Record<
  CommandSurface,
  readonly ImplicationTopIntent[]
> = {
  dashboard: ['booking', 'schedule', 'availability'],
  customer: ['booking', 'availability'],
  public: ['booking', 'availability'],
  provider: ['booking', 'schedule', 'availability'],
};

const PHRASING_BY_ID = new Map(
  CANONICAL_PHRASING_BANK.entries.map((entry) => [entry.id, entry]),
);

function anchorSurfaces(anchorId: string | undefined): CommandSurface[] {
  if (!anchorId) return [...IMPLICATION_SEMANTIC_SURFACES];
  const entry = PHRASING_BY_ID.get(anchorId);
  if (!entry?.surfaces?.length) return ['dashboard'];
  return [...entry.surfaces];
}

/** EN dashboard rows that seed customer/public/dashboard semantic eval siblings. */
export function isImplicationSurfaceExpansionSeed(
  scenario: ImplicationCorpusScenario,
): boolean {
  return (
    scenario.locale === 'en' &&
    scenario.surface === 'dashboard' &&
    !scenario.mustNotMatch?.length
  );
}

export function implicationSurfacesForScenario(
  scenario: ImplicationCorpusScenario,
): CommandSurface[] {
  if (scenario.surface === 'provider') return ['provider'];
  if (scenario.topIntent === 'schedule') return ['dashboard'];
  if (!isImplicationSurfaceExpansionSeed(scenario)) {
    return [scenario.surface];
  }
  return anchorSurfaces(scenario.expectedTopAnchorId);
}

export function implicationScenarioEligibleForSurface(
  scenario: ImplicationCorpusScenario,
  surface: CommandSurface,
): boolean {
  if (scenario.mustNotMatch?.length) return false;
  return implicationSurfacesForScenario(scenario).includes(surface);
}

/** Semantic anchor actions are shared; registry aliases are applied at dispatch. */
export function mapImplicationExpectedActionForSurface(
  action: string,
  _topIntent: ImplicationTopIntent,
  _surface: CommandSurface,
): string {
  return action;
}

export function implicationSurfaceSiblingId(
  baseId: string,
  surface: CommandSurface,
): string {
  const stem = baseId.replace(/^en-/, '');
  return `${surface}-${stem}`;
}

export function buildImplicationSurfaceSiblingScenarios(
  base: ImplicationCorpusScenario,
): ImplicationCorpusScenario[] {
  if (!isImplicationSurfaceExpansionSeed(base)) return [];

  return implicationSurfacesForScenario(base)
    .filter((surface) => surface !== 'dashboard')
    .map((surface) => ({
      ...base,
      id: implicationSurfaceSiblingId(base.id, surface),
      surface,
      expectedAction: mapImplicationExpectedActionForSurface(
        base.expectedAction,
        base.topIntent,
        surface,
      ),
    }));
}

export function buildImplicationSurfaceParityScenarios(
  seeds: readonly ImplicationCorpusScenario[],
): ImplicationCorpusScenario[] {
  const rows: ImplicationCorpusScenario[] = [];
  for (const seed of seeds) {
    rows.push(...buildImplicationSurfaceSiblingScenarios(seed));
  }
  return rows;
}

export type ImplicationSurfaceParityGap = {
  enScenarioId: string;
  topIntent: ImplicationTopIntent;
  missingSurfaces: CommandSurface[];
};

export function countImplicationScenariosBySurfaceAndIntent(
  scenarios: readonly ImplicationCorpusScenario[],
): Record<CommandSurface, Record<ImplicationTopIntent, number>> {
  const counts = Object.fromEntries(
    IMPLICATION_EVAL_SURFACES.map((surface) => [
      surface,
      { booking: 0, schedule: 0, availability: 0 } satisfies Record<
        ImplicationTopIntent,
        number
      >,
    ]),
  ) as Record<CommandSurface, Record<ImplicationTopIntent, number>>;

  for (const scenario of scenarios) {
    if (scenario.mustNotMatch?.length) continue;
    counts[scenario.surface][scenario.topIntent] += 1;
  }
  return counts;
}

export function listImplicationSurfaceParityGaps(
  scenarios: readonly ImplicationCorpusScenario[],
  seeds: readonly ImplicationCorpusScenario[] = scenarios.filter(
    isImplicationSurfaceExpansionSeed,
  ),
): ImplicationSurfaceParityGap[] {
  const present = new Set(scenarios.map((row) => `${row.surface}:${row.id}`));
  const gaps: ImplicationSurfaceParityGap[] = [];

  for (const seed of seeds.filter(isImplicationSurfaceExpansionSeed)) {
    const expectedSurfaces = implicationSurfacesForScenario(seed);
    const missingSurfaces = expectedSurfaces.filter((surface) => {
      const id =
        surface === 'dashboard'
          ? seed.id
          : implicationSurfaceSiblingId(seed.id, surface);
      return !present.has(`${surface}:${id}`);
    });
    if (missingSurfaces.length === 0) continue;
    gaps.push({
      enScenarioId: seed.id,
      topIntent: seed.topIntent,
      missingSurfaces,
    });
  }

  return gaps;
}

export function assertImplicationSurfaceCoverage(
  scenarios: readonly ImplicationCorpusScenario[],
  minPerSurfaceIntent = MIN_IMPLICATION_PROMPTS_PER_SURFACE_INTENT,
): void {
  const counts = countImplicationScenariosBySurfaceAndIntent(scenarios);
  for (const surface of IMPLICATION_EVAL_SURFACES) {
    for (const intent of IMPLICATION_SURFACE_TOP_INTENTS[surface]) {
      if (counts[surface][intent] < minPerSurfaceIntent) {
        throw new Error(
          `implication corpus requires ≥${minPerSurfaceIntent} ${intent} prompts on ${surface}; found ${counts[surface][intent]}`,
        );
      }
    }
  }
}
