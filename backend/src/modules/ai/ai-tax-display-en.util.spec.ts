import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { EN_TAX_DISPLAY_EVAL_SCENARIOS } from './ai-tax-display-en.fixtures.js';
import { AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-tax-display-en.fixtures (ai-cmd-tax-15)', () => {
  const rescue = new AiIntentRescueService();

  it.each(EN_TAX_DISPLAY_EVAL_SCENARIOS)(
    'rescues $expectedAction for EN scenario $id',
    ({ prompt, expectedAction, aspect }) => {
      const rescued = rescue.rescue({ prompt, action: 'unknown', params: {} });
      expect(rescued?.action).toBe(expectedAction);
      if (aspect) expect(rescued?.params?.aspect).toBe(aspect);
    },
  );

  it('passes every tax display EN eval case', () => {
    expect(AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES.length).toBe(10);
    for (const evalCase of AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
