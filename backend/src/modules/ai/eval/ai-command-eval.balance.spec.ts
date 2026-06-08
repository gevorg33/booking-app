import { AI_COMMAND_EVAL_BALANCE_CASES } from './ai-command-eval.balance.fixtures.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.balance.fixtures (acc-2.3)', () => {
  it('generates explicit domain tags for under-represented core domains', () => {
    const domains = new Set(AI_COMMAND_EVAL_BALANCE_CASES.map((entry) => entry.domain));
    expect(domains.has('schedule')).toBe(true);
    expect(domains.has('gift')).toBe(true);
    expect(domains.has('crm')).toBe(true);
    expect(domains.has('integrations')).toBe(true);
    expect(AI_COMMAND_EVAL_BALANCE_CASES.length).toBeGreaterThanOrEqual(720);
  });

  it('passes deterministic eval for every balance case', () => {
    const failures = AI_COMMAND_EVAL_BALANCE_CASES.map((evalCase) =>
      evaluateDeterministicEvalCase(evalCase),
    ).filter((result) => !result.passed);
    if (failures.length > 0) {
      throw new Error(
        failures
          .slice(0, 10)
          .map((entry) => `${entry.id}: ${entry.errors.join('; ')}`)
          .join('\n'),
      );
    }
  });
});
