import {
  ADOPTION_A11Y_STYLESHEET,
  CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES,
  LTR_READING_DIRECTION_LABEL,
  RTL_READING_DIRECTION_LABEL,
  buildExplainRtlLayoutGuidance,
  isExplainRtlLayoutIntent,
  isExplainRtlLayoutPrompt,
  parseExplainRtlLayoutAspect,
  parseExplainRtlLayoutFromPrompt,
  rescueExplainRtlLayoutIntent,
  resolveDocumentDirection,
} from './ai-explain-rtl-layout.util.js';
import {
  EXPLAIN_RTL_LAYOUT_PROMPTS,
  EXPLAIN_RTL_LAYOUT_RESCUE_SCENARIOS,
} from './ai-explain-rtl-layout.fixtures.js';
import { EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS } from './ai-explain-rtl-layout-multilingual.fixtures.js';
import { isGiveAiFeedbackPrompt } from './ai-give-ai-feedback.util.js';

describe('ai-explain-rtl-layout.util', () => {
  it('exports classifier rules and adoption-a11y constants', () => {
    expect(CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES).toContain(
      'explain_rtl_layout',
    );
    expect(ADOPTION_A11Y_STYLESHEET).toBe('adoption-a11y.css');
    expect(RTL_READING_DIRECTION_LABEL).toContain('RTL');
    expect(LTR_READING_DIRECTION_LABEL).toContain('LTR');
  });

  it.each(EXPLAIN_RTL_LAYOUT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain RTL layout prompt for $id',
    (_id, row) => {
      expect(isExplainRtlLayoutPrompt(row.prompt)).toBe(true);
      expect(parseExplainRtlLayoutFromPrompt(row.prompt)).toEqual({
        aspect: expect.any(String),
        documentDirection: expect.any(String),
        locale: expect.any(String),
      });
      expect(rescueExplainRtlLayoutIntent(row.prompt, 'unknown')).toEqual({
        action: 'explain_rtl_layout',
        rescueReason: 'explain_rtl_layout',
      });
    },
  );

  it.each(
    EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual prompt for $id', (_id, row) => {
    expect(isExplainRtlLayoutPrompt(row.prompt)).toBe(true);
    expect(rescueExplainRtlLayoutIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_rtl_layout',
    );
  });

  it.each(
    EXPLAIN_RTL_LAYOUT_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueExplainRtlLayoutIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'explain_rtl_layout',
    });
  });

  it('steals from give_ai_feedback', () => {
    expect(isGiveAiFeedbackPrompt('That was wrong')).toBe(true);
    expect(isExplainRtlLayoutPrompt('That was wrong')).toBe(false);
  });

  it('resolves document direction and builds guidance', () => {
    expect(resolveDocumentDirection({ documentDirection: 'rtl' })).toBe('rtl');
    expect(resolveDocumentDirection({ locale: 'ar' })).toBe('rtl');
    expect(resolveDocumentDirection({ locale: 'hy' })).toBe('ltr');
    expect(parseExplainRtlLayoutAspect('What is RTL?')).toBe(
      'locale_direction',
    );
    const rtl = buildExplainRtlLayoutGuidance('why_right_aligned', 'rtl', 'ar');
    expect(rtl.summaryParts[0]).toContain('right');
    expect(isExplainRtlLayoutIntent('explain_rtl_layout')).toBe(true);
  });
});
