import {
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES,
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CONSUMER_CHIP_CASES,
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_PUBLIC_INTEGRATION_CASES,
  DISCOVER_CROSS_SPRINT_MIN_EVAL_CASES,
  evaluateDiscoverCrossSprintEvalCase,
} from './ai-service-discovery.eval.util.js';

describe('ai service discovery eval cases (discover-exit-3)', () => {
  it('ships at least 30 cross-sprint eval cases tagged discover-*', () => {
    expect(
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES.length,
    ).toBeGreaterThanOrEqual(DISCOVER_CROSS_SPRINT_MIN_EVAL_CASES);
    for (const evalCase of AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES) {
      expect(evalCase.id).toMatch(/^discover-/);
    }
    expect(
      new Set(AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES.map((row) => row.id))
        .size,
    ).toBe(AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES.length);
  });

  it('covers public integration, multilingual, and consumer chip cross-sprint rows', () => {
    expect(
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_PUBLIC_INTEGRATION_CASES.length,
    ).toBe(18);
    expect(
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES.length,
    ).toBeGreaterThanOrEqual(24);
    expect(
      AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CONSUMER_CHIP_CASES.length,
    ).toBe(3);
  });

  it.each(AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES)(
    'passes deterministic discover eval $id',
    (evalCase) => {
      const result = evaluateDiscoverCrossSprintEvalCase(evalCase);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    },
  );
});
