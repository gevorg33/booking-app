import {
  AI_COMMAND_EVAL_ADOPT_6_CUSTOMER_GROWTH_CASES,
  AI_COMMAND_EVAL_ADOPT_6_GROWTH_CASES,
  AI_COMMAND_EVAL_ADOPT_6_PROVIDER_GROWTH_CASES,
  adopt6CustomerScenarioToEvalCase,
  adopt6ProviderScenarioToEvalCase,
} from './ai-adopt-6-growth-loops.eval.util.js';
import {
  CUSTOMER_ADOPT_6_PROMPT_SCENARIOS,
  PROVIDER_ADOPT_6_PROMPT_SCENARIOS,
} from '../ai-adopt-6-growth-loops.fixtures.js';

describe('ai-adopt-6-growth-loops.eval.util', () => {
  it('maps every customer and provider adopt-6 scenario to eval cases', () => {
    expect(AI_COMMAND_EVAL_ADOPT_6_CUSTOMER_GROWTH_CASES).toHaveLength(
      CUSTOMER_ADOPT_6_PROMPT_SCENARIOS.length,
    );
    expect(AI_COMMAND_EVAL_ADOPT_6_PROVIDER_GROWTH_CASES).toHaveLength(
      PROVIDER_ADOPT_6_PROMPT_SCENARIOS.length,
    );
    expect(AI_COMMAND_EVAL_ADOPT_6_GROWTH_CASES).toHaveLength(
      CUSTOMER_ADOPT_6_PROMPT_SCENARIOS.length +
        PROVIDER_ADOPT_6_PROMPT_SCENARIOS.length,
    );
  });

  it.each(CUSTOMER_ADOPT_6_PROMPT_SCENARIOS)(
    'customer eval case $id uses customer surface',
    (scenario) => {
      const evalCase = adopt6CustomerScenarioToEvalCase(scenario);
      expect(evalCase.surface).toBe('customer');
      expect(evalCase.expect.rescuedAction).toBe(scenario.action);
    },
  );

  it.each(PROVIDER_ADOPT_6_PROMPT_SCENARIOS)(
    'provider eval case $id uses provider surface',
    (scenario) => {
      const evalCase = adopt6ProviderScenarioToEvalCase(scenario);
      expect(evalCase.surface).toBe('provider');
      expect(evalCase.expect.rescuedAction).toBe(scenario.action);
    },
  );
});
