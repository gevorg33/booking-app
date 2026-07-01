import { handleExplainRtlLayoutLogic } from './ai-explain-rtl-layout.logic.js';
import { EXPLAIN_RTL_LAYOUT_HANDLER_FIXTURES } from './ai-explain-rtl-layout.fixtures.js';
import { ADOPTION_A11Y_STYLESHEET } from './ai-explain-rtl-layout.util.js';

describe('ai-explain-rtl-layout.logic', () => {
  it.each(EXPLAIN_RTL_LAYOUT_HANDLER_FIXTURES)(
    'returns aspect-specific copy for $id',
    async ({ prompt, aspect, params }) => {
      const result = await handleExplainRtlLayoutLogic('biz-1', params, prompt);
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_rtl_layout');
      expect(result.details?.aspect).toBe(aspect);
      expect(result.details?.adoptionA11yStylesheet).toBe(
        ADOPTION_A11Y_STYLESHEET,
      );
      expect(result.details?.rtlLayoutHelp).toBe(true);
      expect(Array.isArray(result.details?.nextSteps)).toBe(true);
    },
  );

  it('fails clarify when prompt does not match', async () => {
    const result = await handleExplainRtlLayoutLogic(
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns logical CSS guidance when asked about padding-inline', async () => {
    const result = await handleExplainRtlLayoutLogic(
      'biz-1',
      { locale: 'en' },
      'Explain padding-inline RTL-safe layout',
    );
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('logical_css');
    expect(result.summary).toContain('adoption-a11y.css');
  });
});
