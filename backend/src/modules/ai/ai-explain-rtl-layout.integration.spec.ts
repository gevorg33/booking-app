import { validateCommand } from './command-completion.validator.js';
import { handleExplainRtlLayoutLogic } from './ai-explain-rtl-layout.logic.js';
import {
  EXPLAIN_RTL_LAYOUT_PROMPTS,
  EXPLAIN_RTL_LAYOUT_RESCUE_SCENARIOS,
} from './ai-explain-rtl-layout.fixtures.js';
import { rescueExplainRtlLayoutIntent } from './ai-explain-rtl-layout.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain RTL layout integration (ai-cmd-customer-4.19.4)', () => {
  it.each(EXPLAIN_RTL_LAYOUT_PROMPTS)('validates $id', ({ prompt }) => {
    const validation = validateCommand(
      makeResolvedCommand({
        action: 'explain_rtl_layout',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }),
    );
    expect(validation.issues).toEqual([]);
  });

  it.each(EXPLAIN_RTL_LAYOUT_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainRtlLayoutIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with RTL direction context', async () => {
    const result = await handleExplainRtlLayoutLogic(
      'biz-1',
      { locale: 'ar', documentDirection: 'rtl' },
      'Why is text on the right?',
    );
    expect(result.action).toBe('explain_rtl_layout');
    expect(result.success).toBe(true);
    expect(result.details?.documentDirection).toBe('rtl');
    expect(result.summary).toContain('right');
  });
});
