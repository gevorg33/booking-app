import {
  E2E86_HANDLER_PROMPTS,
  E2E86_LEAKY_SAMPLE_STRINGS,
  E2E86_RTL_GUIDANCE_CASES,
} from './ai-e2e86-rtl-css-filename-leak.fixtures.js';
import { handleExplainRtlLayoutLogic } from './ai-explain-rtl-layout.logic.js';
import {
  ADOPTION_A11Y_STYLESHEET,
  buildExplainRtlLayoutGuidance,
  collectExplainRtlLayoutCustomerFacingText,
  explainRtlLayoutCustomerTextLeaksInternalCss,
} from './ai-explain-rtl-layout.util.js';

describe('e2e-bug.86 explain_rtl_layout must not leak CSS filenames', () => {
  it.each(E2E86_LEAKY_SAMPLE_STRINGS)(
    '$id: leak detector flags historical copy',
    ({ text }) => {
      expect(explainRtlLayoutCustomerTextLeaksInternalCss(text)).toBe(true);
    },
  );

  it.each(E2E86_RTL_GUIDANCE_CASES)(
    '$id: guidance summary/hint/nextSteps stay customer-safe',
    ({ aspect, documentDirection, locale }) => {
      const guidance = buildExplainRtlLayoutGuidance(
        aspect,
        documentDirection,
        locale,
      );
      for (const part of collectExplainRtlLayoutCustomerFacingText(guidance)) {
        expect(explainRtlLayoutCustomerTextLeaksInternalCss(part)).toBe(false);
        expect(part).not.toContain(ADOPTION_A11Y_STYLESHEET);
      }
    },
  );

  it.each(E2E86_HANDLER_PROMPTS)(
    '$id: handler summary/nextSteps omit stylesheet; details keep it',
    async ({ prompt, params }) => {
      const result = await handleExplainRtlLayoutLogic('biz-1', params, prompt);
      expect(result.success).toBe(true);
      expect(
        explainRtlLayoutCustomerTextLeaksInternalCss(result.summary ?? ''),
      ).toBe(false);
      expect(result.summary).not.toContain(ADOPTION_A11Y_STYLESHEET);
      const nextSteps = (result.details?.nextSteps as string[] | undefined) ?? [];
      for (const step of nextSteps) {
        expect(explainRtlLayoutCustomerTextLeaksInternalCss(step)).toBe(false);
      }
      const hint = String(result.details?.hint ?? '');
      expect(explainRtlLayoutCustomerTextLeaksInternalCss(hint)).toBe(false);
      expect(result.details?.adoptionA11yStylesheet).toBe(
        ADOPTION_A11Y_STYLESHEET,
      );
    },
  );
});
