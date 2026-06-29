import {
  PRODUCT_GUIDE_GROUNDING_SCENARIOS,
  SAMPLE_GUIDE_RESPONSE,
} from './ai-product-guide.fixtures.js';
import {
  buildGuideGroundingClarifyResult,
  isGroundedGuideRoute,
  verifyGuideResponseGrounding,
} from './ai-product-guide-grounding.util.js';
import { handleExplainAppFeatureLogic } from './ai-product-guide.logic.js';

describe('ai-product-guide-grounding.util (ai-guide-1.2.4)', () => {
  it('accepts known dashboard routes and corpus-backed guides', () => {
    expect(isGroundedGuideRoute('/dashboard/schedule')).toBe(true);
    expect(isGroundedGuideRoute('/dashboard/operations/inventory')).toBe(true);
    expect(isGroundedGuideRoute('/tabs/today')).toBe(true);
    expect(isGroundedGuideRoute('/accept-invite')).toBe(true);
    expect(isGroundedGuideRoute('professionals')).toBe(true);
    expect(isGroundedGuideRoute('checkout')).toBe(true);
    expect(verifyGuideResponseGrounding(SAMPLE_GUIDE_RESPONSE).ok).toBe(true);
  });

  it.each(PRODUCT_GUIDE_GROUNDING_SCENARIOS)(
    'flags grounding issues for $id',
    ({ guide, expectedIssueCodes, validateSettingsKeys = false }) => {
      const result = verifyGuideResponseGrounding(guide, {
        validateSettingsKeys,
      });
      if (expectedIssueCodes.length === 0) {
        expect(result.ok).toBe(true);
        return;
      }
      expect(result.ok).toBe(false);
      for (const code of expectedIssueCodes) {
        expect(result.issues.some((issue) => issue.code === code)).toBe(true);
      }
    },
  );

  it('buildGuideGroundingClarifyResult returns clarify payload', () => {
    const result = buildGuideGroundingClarifyResult('guide_user_flow', {
      ok: false,
      issues: [{ code: 'unknown_route', message: 'bad route', value: '/bad' }],
    });
    expect(result.success).toBe(false);
    expect(result.details.clarify).toBe(true);
    expect(result.details.groundingFailed).toBe(true);
  });

  it('passes grounding for built corpus guides', () => {
    const result = handleExplainAppFeatureLogic({
      businessId: 'biz-1',
      prompt: 'What does the Orchestrix command bar do?',
      locale: 'en',
    });
    expect(result.success).toBe(true);
    expect(result.guide?.navigate).toEqual({
      path: '/dashboard/guide',
      hash: 'ai-command-bar',
    });
  });
});
