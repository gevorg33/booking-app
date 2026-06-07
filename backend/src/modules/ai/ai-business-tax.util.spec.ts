import {
  CONFIGURE_BUSINESS_TAX_PROMPTS,
  EXPLAIN_BUSINESS_TAX_PROMPTS,
  SET_SERVICE_TAX_RATE_PROMPTS,
} from './ai-business-tax.fixtures.js';
import {
  isConfigureBusinessTaxPrompt,
  isExplainBusinessTaxPrompt,
  isSetServiceTaxRatePrompt,
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
  rescueBusinessTaxIntent,
} from './ai-business-tax.util.js';

describe('ai-business-tax.util (ai-cmd-tax-1..3)', () => {
  it.each(CONFIGURE_BUSINESS_TAX_PROMPTS)(
    'parses configure tax settings from $id',
    ({ prompt, enabled, rate, name, model }) => {
      expect(isConfigureBusinessTaxPrompt(prompt)).toBe(true);
      expect(isSetServiceTaxRatePrompt(prompt)).toBe(false);
      const parsed = parseBusinessTaxFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (enabled !== undefined) expect(parsed?.enabled).toBe(enabled);
      if (rate !== undefined) expect(parsed?.rate).toBe(rate);
      if (name !== undefined) expect(parsed?.name).toBe(name);
      if (model !== undefined) expect(parsed?.model).toBe(model);
    },
  );

  it.each(SET_SERVICE_TAX_RATE_PROMPTS)(
    'parses service tax override from $id',
    ({ prompt, serviceQuery, taxRatePercent }) => {
      expect(isSetServiceTaxRatePrompt(prompt)).toBe(true);
      expect(isConfigureBusinessTaxPrompt(prompt)).toBe(false);
      const parsed = parseSetServiceTaxRateFromPrompt(prompt);
      expect(parsed).toEqual({
        serviceQuery,
        taxRatePercent,
      });
    },
  );

  it.each(EXPLAIN_BUSINESS_TAX_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainBusinessTaxPrompt(prompt)).toBe(true);
      expect(isConfigureBusinessTaxPrompt(prompt)).toBe(false);
      expect(isSetServiceTaxRatePrompt(prompt)).toBe(false);
    },
  );

  it('prefers explicit params over prompt parsing', () => {
    expect(
      parseBusinessTaxFromPrompt('Enable 20% VAT', {
        enabled: false,
        rate: 8,
        name: 'GST',
        model: 'inclusive',
      }),
    ).toEqual({
      enabled: false,
      rate: 8,
      name: 'GST',
      model: 'inclusive',
    });
    expect(
      parseSetServiceTaxRateFromPrompt('Make massage services tax-exempt', {
        serviceQuery: 'facials',
        taxRatePercent: 5,
      }),
    ).toEqual({
      serviceQuery: 'facials',
      taxRatePercent: 5,
    });
  });

  it('rescues configure, service override, and explain prompts', () => {
    expect(rescueBusinessTaxIntent('Enable 20% VAT', 'unknown')).toEqual({
      action: 'configure_business_tax',
      rescueReason: 'configure_business_tax',
    });
    expect(
      rescueBusinessTaxIntent('Make massage services tax-exempt', 'unknown'),
    ).toEqual({
      action: 'set_service_tax_rate',
      rescueReason: 'set_service_tax_rate',
    });
    expect(rescueBusinessTaxIntent('What is our VAT rate?', 'unknown')).toEqual(
      {
        action: 'explain_business_tax',
        rescueReason: 'explain_business_tax',
      },
    );
    expect(
      rescueBusinessTaxIntent('Enable 20% VAT', 'configure_business_tax'),
    ).toBeNull();
  });
});
