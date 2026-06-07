import { EXPLAIN_TENANT_CURRENCY_PROMPTS } from './ai-tenant-currency.fixtures.js';
import {
  isExplainTenantCurrencyPrompt,
  isTenantCurrencyIntent,
  rescueTenantCurrencyIntent,
} from './ai-tenant-currency.util.js';

describe('ai-tenant-currency.util (ai-cmd-curr-6)', () => {
  it.each(EXPLAIN_TENANT_CURRENCY_PROMPTS)(
    'detects explain tenant currency prompt $id',
    ({ prompt }) => {
      expect(isExplainTenantCurrencyPrompt(prompt)).toBe(true);
    },
  );

  it('does not steal explain_checkout_total breakdown prompts', () => {
    expect(
      isExplainTenantCurrencyPrompt('Explain the checkout total in the app'),
    ).toBe(false);
  });

  it('does not steal public booking page currency prompts', () => {
    expect(
      isExplainTenantCurrencyPrompt(
        'Why do prices show euros on the booking page?',
      ),
    ).toBe(false);
    expect(
      rescueTenantCurrencyIntent(
        'Why do prices show euros on the booking page?',
        'unknown',
      ),
    ).toBeNull();
  });

  it('does not steal dashboard business currency explain prompts', () => {
    expect(
      isExplainTenantCurrencyPrompt('Which currency does the salon use?'),
    ).toBe(false);
    expect(isExplainTenantCurrencyPrompt('What is our default currency?')).toBe(
      false,
    );
  });

  it('rescues misclassified consumer app currency prompts', () => {
    expect(
      rescueTenantCurrencyIntent(
        'Why does the salon app show prices in euros after I log in?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_tenant_currency',
      rescueReason: 'explain_tenant_currency',
    });
  });

  it('recognizes tenant currency intent id', () => {
    expect(isTenantCurrencyIntent('explain_tenant_currency')).toBe(true);
    expect(isTenantCurrencyIntent('explain_checkout_currency')).toBe(false);
  });
});
