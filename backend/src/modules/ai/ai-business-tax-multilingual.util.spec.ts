import { MULTILINGUAL_BUSINESS_TAX_EVAL_SCENARIOS } from './ai-business-tax-multilingual.fixtures.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
  rescueBusinessTaxIntent,
} from './ai-business-tax.util.js';

describe('ai-business-tax multilingual (ai-cmd-tax-4)', () => {
  it.each(MULTILINGUAL_BUSINESS_TAX_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueBusinessTaxIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      if (expectedAction === 'configure_business_tax' && paramsPartial) {
        expect(parseBusinessTaxFromPrompt(prompt)).toEqual(
          expect.objectContaining(paramsPartial),
        );
      }
      if (expectedAction === 'set_service_tax_rate' && paramsPartial) {
        expect(parseSetServiceTaxRateFromPrompt(prompt)).toEqual(
          expect.objectContaining(paramsPartial),
        );
      }
    },
  );
});
