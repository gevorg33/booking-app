import { MULTILINGUAL_STACKED_TAX_EVAL_SCENARIOS } from './ai-stacked-tax-multilingual.fixtures.js';
import {
  parseConfigureStackedTaxRulesFromPrompt,
  rescueStackedTaxIntent,
} from './ai-stacked-tax.util.js';

describe('ai-stacked-tax multilingual (ai-cmd-tax-8)', () => {
  it.each(MULTILINGUAL_STACKED_TAX_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueStackedTaxIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      if (
        expectedAction === 'configure_stacked_tax_rules' &&
        paramsPartial?.operation === 'add'
      ) {
        expect(parseConfigureStackedTaxRulesFromPrompt(prompt)).toEqual(
          expect.objectContaining({ operation: 'add' }),
        );
      }
      if (
        expectedAction === 'configure_stacked_tax_rules' &&
        paramsPartial?.operation === 'remove'
      ) {
        expect(parseConfigureStackedTaxRulesFromPrompt(prompt)?.operation).toBe(
          'remove',
        );
      }
    },
  );
});
