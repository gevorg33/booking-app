import {
  AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS,
  AI_IMPLICATION_CORPUS_SCENARIOS,
} from './ai-implication-corpus.fixtures.js';
import {
  buildImplicationSurfaceSiblingScenarios,
  implicationScenarioEligibleForSurface,
  implicationSurfaceSiblingId,
  implicationSurfacesForScenario,
  isImplicationSurfaceExpansionSeed,
  mapImplicationExpectedActionForSurface,
} from './ai-implication-corpus-surface-parity.util.js';

describe('ai-implication-corpus-surface-parity.util', () => {
  it('maps booking seed to customer and public siblings', () => {
    const seed = AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS.find(
      (row) => row.id === 'en-hair-long-implied-booking',
    )!;
    expect(implicationSurfacesForScenario(seed)).toEqual([
      'dashboard',
      'customer',
      'public',
    ]);
    const siblings = buildImplicationSurfaceSiblingScenarios(seed);
    expect(siblings.map((row) => row.surface).sort()).toEqual([
      'customer',
      'public',
    ]);
    expect(siblings[0].expectedAction).toBe(
      mapImplicationExpectedActionForSurface(
        seed.expectedAction,
        seed.topIntent,
        siblings[0].surface,
      ),
    );
  });

  it('keeps schedule seeds dashboard-only', () => {
    const seed = AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS.find(
      (row) => row.id === 'en-work-time-implied-schedule',
    )!;
    expect(implicationSurfacesForScenario(seed)).toEqual(['dashboard']);
    expect(buildImplicationSurfaceSiblingScenarios(seed)).toEqual([]);
  });

  it('indexes generated siblings in the full corpus', () => {
    for (const seed of AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS.filter(
      isImplicationSurfaceExpansionSeed,
    )) {
      for (const surface of implicationSurfacesForScenario(seed)) {
        if (surface === 'dashboard') continue;
        const id = implicationSurfaceSiblingId(seed.id, surface);
        expect(
          AI_IMPLICATION_CORPUS_SCENARIOS.some(
            (row) => row.id === id && row.surface === surface,
          ),
        ).toBe(true);
        expect(implicationScenarioEligibleForSurface(seed, surface)).toBe(true);
      }
    }
  });
});
