import {
  BULK_UPDATE_SERVICE_CURRENCY_PROMPTS,
  CONFIGURE_BUSINESS_CURRENCY_PROMPTS,
  EXPLAIN_BUSINESS_CURRENCY_PROMPTS,
} from './ai-business-currency.fixtures.js';
import { MULTILINGUAL_BUSINESS_CURRENCY_EVAL_SCENARIOS } from './ai-business-currency-multilingual.fixtures.js';
import {
  isBulkUpdateServiceCurrencyPrompt,
  isConfigureBusinessCurrencyPrompt,
  isExplainBusinessCurrencyPrompt,
  parseCurrencyFromPrompt,
  rescueBusinessCurrencyIntent,
} from './ai-business-currency.util.js';

describe('ai-business-currency.util (ai-cmd-curr-1..3)', () => {
  it.each(CONFIGURE_BUSINESS_CURRENCY_PROMPTS)(
    'parses currency from $id',
    ({ prompt, currencyCode }) => {
      expect(isConfigureBusinessCurrencyPrompt(prompt)).toBe(true);
      expect(parseCurrencyFromPrompt(prompt)).toBe(currencyCode);
    },
  );

  it.each(EXPLAIN_BUSINESS_CURRENCY_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainBusinessCurrencyPrompt(prompt)).toBe(true);
      expect(isConfigureBusinessCurrencyPrompt(prompt)).toBe(false);
      expect(isBulkUpdateServiceCurrencyPrompt(prompt)).toBe(false);
    },
  );

  it.each(BULK_UPDATE_SERVICE_CURRENCY_PROMPTS)(
    'detects bulk update prompt $id',
    ({ prompt }) => {
      expect(isBulkUpdateServiceCurrencyPrompt(prompt)).toBe(true);
      expect(isExplainBusinessCurrencyPrompt(prompt)).toBe(false);
    },
  );

  it('prefers explicit currencyCode param', () => {
    expect(
      parseCurrencyFromPrompt('change currency', { currencyCode: 'GEL' }),
    ).toBe('GEL');
  });

  it('rescues misclassified currency configuration prompts', () => {
    expect(
      rescueBusinessCurrencyIntent('Set default currency to AMD', 'unknown'),
    ).toEqual({
      action: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
    });
    expect(
      rescueBusinessCurrencyIntent(
        'Set default currency to AMD',
        'configure_business_currency',
      ),
    ).toBeNull();
  });

  it('rescues explain prompts without a target currency code', () => {
    expect(
      rescueBusinessCurrencyIntent('What is our default currency?', 'unknown'),
    ).toEqual({
      action: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
    });
    expect(
      rescueBusinessCurrencyIntent(
        'How many services are on a different currency?',
        'list_services',
      ),
    ).toEqual({
      action: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
    });
  });

  it('rescues bulk migration prompts', () => {
    expect(
      rescueBusinessCurrencyIntent(
        'Align all services to business default currency',
        'unknown',
      ),
    ).toEqual({
      action: 'bulk_update_service_currency',
      rescueReason: 'bulk_update_service_currency',
    });
  });

  it('prefers configure rescue when prompt includes a target currency', () => {
    expect(
      rescueBusinessCurrencyIntent('Set default currency to AMD', 'unknown'),
    ).toEqual({
      action: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
    });
  });

  it.each(MULTILINGUAL_BUSINESS_CURRENCY_EVAL_SCENARIOS)(
    'rescues multilingual scenario $id',
    ({ prompt, expectedAction, paramsPartial }) => {
      const rescued = rescueBusinessCurrencyIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      if (paramsPartial?.currencyCode) {
        expect(parseCurrencyFromPrompt(prompt)).toBe(
          paramsPartial.currencyCode,
        );
      }
    },
  );
});
