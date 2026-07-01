import {
  AI_IMPLICATION_CORPUS_SCENARIOS,
  AI_IMPLICATION_CORPUS_SURFACE_SCENARIOS,
  AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS,
} from './ai-implication-corpus.fixtures.js';
import {
  assertImplicationSurfaceCoverage,
  buildImplicationSurfaceParityScenarios,
  IMPLICATION_CORPUS_SURFACE_PIPE_MARKER,
  IMPLICATION_EVAL_SURFACES,
  IMPLICATION_SURFACE_TOP_INTENTS,
  listImplicationSurfaceParityGaps,
  MIN_IMPLICATION_PROMPTS_PER_SURFACE_INTENT,
  implicationSurfaceSiblingId,
} from './ai-implication-corpus-surface-parity.util.js';

describe('ai-implication-corpus surface parity (pipe-1.12.5)', () => {
  it('exports pipe marker', () => {
    expect(IMPLICATION_CORPUS_SURFACE_PIPE_MARKER).toBe('pipe-1.12.5');
  });

  it('generates customer/public siblings for every EN dashboard seed', () => {
    expect(
      listImplicationSurfaceParityGaps(AI_IMPLICATION_CORPUS_SCENARIOS),
    ).toEqual([]);
  });

  it('ships generated surface rows in the full corpus export', () => {
    const generated = buildImplicationSurfaceParityScenarios(
      AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS,
    );
    expect(AI_IMPLICATION_CORPUS_SURFACE_SCENARIOS).toEqual(generated);
    for (const row of generated) {
      expect(
        AI_IMPLICATION_CORPUS_SCENARIOS.some(
          (scenario) =>
            scenario.id === row.id && scenario.surface === row.surface,
        ),
      ).toBe(true);
    }
  });

  it('duplicates hair-long booking prompt on customer and public surfaces', () => {
    expect(
      AI_IMPLICATION_CORPUS_SCENARIOS.some(
        (row) =>
          row.id ===
            implicationSurfaceSiblingId(
              'en-hair-long-implied-booking',
              'customer',
            ) && row.surface === 'customer',
      ),
    ).toBe(true);
    expect(
      AI_IMPLICATION_CORPUS_SCENARIOS.some(
        (row) =>
          row.id ===
            implicationSurfaceSiblingId(
              'en-hair-long-implied-booking',
              'public',
            ) && row.surface === 'public',
      ),
    ).toBe(true);
  });

  it(`includes ≥${MIN_IMPLICATION_PROMPTS_PER_SURFACE_INTENT} eval-eligible rows per surface and top intent`, () => {
    expect(() =>
      assertImplicationSurfaceCoverage(AI_IMPLICATION_CORPUS_SCENARIOS),
    ).not.toThrow();
  });

  it('tags every eval surface in the corpus', () => {
    for (const surface of IMPLICATION_EVAL_SURFACES) {
      expect(
        AI_IMPLICATION_CORPUS_SCENARIOS.some((row) => row.surface === surface),
      ).toBe(true);
    }
  });
});
