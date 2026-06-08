import {
  ACC_EVAL_AMBIGUITY_CATEGORIES,
  ACC_EVAL_MIN_AMBIGUITY_CASES,
  AMBIGUITY_CORPUS_SEEDS,
  buildAmbiguityCorpusEvalCases,
  buildAmbiguityCorpusReport,
  countEmployeeNameMatches,
  deriveAmbiguityClarifyFields,
  AMBIGUITY_EVAL_EMPLOYEES,
  AMBIGUITY_EVAL_SERVICES,
} from './ai-command-eval.ambiguity.util.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';
import {
  assessAmbiguityCorpusCompoundPrecision,
} from '../ai-compound-precision.util.js';
import { decomposeDeterministicForSurface } from '../intent-decomposition.util.js';

describe('ai-command-eval.ambiguity.util (acc-2.6)', () => {
  it('countEmployeeNameMatches flags ambiguous Maria providers', () => {
    expect(countEmployeeNameMatches(AMBIGUITY_EVAL_EMPLOYEES, 'Maria')).toBe(2);
    expect(countEmployeeNameMatches(AMBIGUITY_EVAL_EMPLOYEES, 'Gevorg')).toBe(1);
  });

  it.each(AMBIGUITY_CORPUS_SEEDS.map((seed) => [seed.id, seed]))(
    'seed %s derives expected clarify fields',
    (_id, seed) => {
      const actual = deriveAmbiguityClarifyFields(seed);
      for (const field of seed.clarifyFields) {
        expect(actual).toContain(field);
      }
    },
  );

  it(`acc-2.6 — ambiguity corpus meets minimum ${ACC_EVAL_MIN_AMBIGUITY_CASES} cases`, () => {
    const cases = buildAmbiguityCorpusEvalCases();
    const report = buildAmbiguityCorpusReport(cases);
    expect(report.total).toBeGreaterThanOrEqual(ACC_EVAL_MIN_AMBIGUITY_CASES);
    expect(report.passedGate).toBe(true);
    for (const category of ACC_EVAL_AMBIGUITY_CATEGORIES) {
      expect(report.byCategory[category]).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(buildAmbiguityCorpusEvalCases().map((entry) => [entry.id, entry]))(
    'eval case %s passes deterministic ambiguity gate',
    (_id, evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    },
  );

  it('acc-3.9 — ambiguity compoundExpectEmpty cases never decompose into multi-step', () => {
    const report = assessAmbiguityCorpusCompoundPrecision(
      buildAmbiguityCorpusEvalCases(),
      decomposeDeterministicForSurface,
    );
    expect(report.passed).toBe(true);
    expect(report.ambiguityFalseCompounds).toBe(0);
  });

  it('ambiguous service seed matches multiple catalog services', () => {
    const seed = AMBIGUITY_CORPUS_SEEDS.find(
      (entry) => entry.id === 'ambiguous-service-massage',
    );
    expect(seed).toBeDefined();
    expect(deriveAmbiguityClarifyFields(seed!)).toEqual(['serviceName']);
    expect(AMBIGUITY_EVAL_SERVICES.filter((s) => /massage/i.test(s.name)).length).toBeGreaterThan(1);
  });
});
