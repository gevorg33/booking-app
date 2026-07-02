import {
  AI_IMPLICATION_CORPUS_EVAL_SCENARIOS,
  AI_COMMAND_EVAL_IMPLICATION_CASES,
  IMPLICATION_CORPUS_PIPE_MARKER,
  implicationCorpusEvalCaseId,
} from './ai-implication-corpus.eval.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { resolveEvalCaseIntentLabel } from './eval/ai-command-eval.report.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_IMPLICATION_CASES as CASES_EXPORT,
} from './eval/ai-command-eval.cases.js';
import {
  countImplicationScenariosByIntent,
  MIN_IMPLICATION_PROMPTS_PER_INTENT,
} from './ai-implication-corpus.util.js';
import {
  IMPLICATION_EVAL_SURFACES,
  MIN_IMPLICATION_PROMPTS_PER_SURFACE_INTENT,
  IMPLICATION_SURFACE_TOP_INTENTS,
  countImplicationScenariosBySurfaceAndIntent,
} from './ai-implication-corpus-surface-parity.util.js';

describe('ai implication corpus eval (pipe-1.11.2)', () => {
  it('exports pipe marker', () => {
    expect(IMPLICATION_CORPUS_PIPE_MARKER).toBe('pipe-1.11.1');
  });

  it('maps every eval-eligible implication scenario to a golden case', () => {
    expect(AI_COMMAND_EVAL_IMPLICATION_CASES.length).toBe(
      AI_IMPLICATION_CORPUS_EVAL_SCENARIOS.length,
    );
    for (const scenario of AI_IMPLICATION_CORPUS_EVAL_SCENARIOS) {
      expect(
        AI_COMMAND_EVAL_IMPLICATION_CASES.some(
          (row) => row.id === implicationCorpusEvalCaseId(scenario),
        ),
      ).toBe(true);
    }
  });

  it('re-exports implication cases from ai-command-eval.cases.ts', () => {
    expect(CASES_EXPORT).toEqual(AI_COMMAND_EVAL_IMPLICATION_CASES);
    expect(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.filter((row) =>
        row.id.startsWith('implication-corpus-'),
      ),
    ).toEqual(AI_COMMAND_EVAL_IMPLICATION_CASES);
  });

  it('tags eval cases with implication top-intent scorecard labels', () => {
    const counts = countImplicationScenariosByIntent(
      AI_IMPLICATION_CORPUS_EVAL_SCENARIOS,
    );
    for (const [intent, total] of Object.entries(counts)) {
      const labeled = AI_COMMAND_EVAL_IMPLICATION_CASES.filter(
        (row) => row.expect.implicationTopIntent === intent,
      );
      expect(labeled.length).toBe(total);
      for (const row of labeled) {
        const actionLabel =
          row.expect.semanticMatchAction ?? row.expect.rescuedAction;
        expect(resolveEvalCaseIntentLabel(row)).toBe(
          `implication:${intent}:${actionLabel}`,
        );
      }
    }
  });

  it(`includes ≥${MIN_IMPLICATION_PROMPTS_PER_SURFACE_INTENT} implication eval cases per surface and top intent (pipe-1.12.5)`, () => {
    const counts = countImplicationScenariosBySurfaceAndIntent(
      AI_IMPLICATION_CORPUS_EVAL_SCENARIOS,
    );
    for (const surface of IMPLICATION_EVAL_SURFACES) {
      for (const intent of IMPLICATION_SURFACE_TOP_INTENTS[surface]) {
        const labeled = AI_COMMAND_EVAL_IMPLICATION_CASES.filter(
          (row) =>
            row.surface === surface &&
            row.expect.implicationTopIntent === intent,
        );
        expect(labeled.length).toBe(counts[surface][intent]);
        expect(labeled.length).toBeGreaterThanOrEqual(
          MIN_IMPLICATION_PROMPTS_PER_SURFACE_INTENT,
        );
      }
    }
  });

  it('tags implication eval cases with their surface', () => {
    for (const row of AI_COMMAND_EVAL_IMPLICATION_CASES) {
      expect(row.surface).toBeDefined();
      expect(IMPLICATION_EVAL_SURFACES).toContain(row.surface);
    }
  });

  it(`includes ≥${MIN_IMPLICATION_PROMPTS_PER_INTENT} implication eval cases per top intent`, () => {
    const byIntent = {
      booking: AI_COMMAND_EVAL_IMPLICATION_CASES.filter(
        (row) => row.expect.implicationTopIntent === 'booking',
      ).length,
      schedule: AI_COMMAND_EVAL_IMPLICATION_CASES.filter(
        (row) => row.expect.implicationTopIntent === 'schedule',
      ).length,
      availability: AI_COMMAND_EVAL_IMPLICATION_CASES.filter(
        (row) => row.expect.implicationTopIntent === 'availability',
      ).length,
    };
    expect(byIntent.booking).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
    expect(byIntent.schedule).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
    expect(byIntent.availability).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
  });

  it.each(
    AI_IMPLICATION_CORPUS_EVAL_SCENARIOS.map((scenario) => [
      scenario.id,
      scenario,
    ]),
  )('passes implication corpus eval case %s', (_id, scenario) => {
    const evalCase = AI_COMMAND_EVAL_IMPLICATION_CASES.find(
      (row) => row.id === implicationCorpusEvalCaseId(scenario),
    );
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
  });
});
