import { AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES } from './ai-product-guide.eval.util.js';
import { PRODUCT_GUIDE_CLASSIFIER_SCENARIOS } from './ai-product-guide.fixtures.js';

describe('ai-product-guide.eval.util (ai-guide-1.2.6)', () => {
  it('maps every classifier scenario to a dashboard eval case', () => {
    const ids = new Set(AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES.map((row) => row.id));
    for (const scenario of PRODUCT_GUIDE_CLASSIFIER_SCENARIOS) {
      expect(ids.has(`product-guide-classifier-${scenario.id}`)).toBe(true);
    }
    expect(AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES.length).toBeGreaterThanOrEqual(14);
  });

  it('tags eval cases with dashboard surface', () => {
    for (const row of AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES) {
      expect(row.surface).toBe('dashboard');
    }
  });
});
