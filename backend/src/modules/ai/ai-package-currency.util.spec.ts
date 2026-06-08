import { EXPLAIN_PACKAGE_CURRENCY_PROMPTS } from './ai-package-currency.fixtures.js';
import { CATALOG_NOTIFY_DASHBOARD_SCENARIOS } from './ai-catalog-notify.fixtures.js';
import {
  isExplainPackageCurrencyPrompt,
  isPackageCurrencyIntent,
  rescuePackageCurrencyIntent,
} from './ai-package-currency.util.js';

describe('ai-package-currency.util (ai-cmd-curr-7)', () => {
  it.each(EXPLAIN_PACKAGE_CURRENCY_PROMPTS)(
    'detects explain package currency prompt $id',
    ({ prompt }) => {
      expect(isExplainPackageCurrencyPrompt(prompt)).toBe(true);
    },
  );

  it('does not steal generic booking-page checkout currency prompts', () => {
    expect(
      isExplainPackageCurrencyPrompt(
        'Why do prices show euros on the booking page?',
      ),
    ).toBe(false);
    expect(
      rescuePackageCurrencyIntent(
        'Why do prices show euros on the booking page?',
        'unknown',
      ),
    ).toBeNull();
  });

  it('does not steal consumer app tenant currency prompts', () => {
    expect(
      isExplainPackageCurrencyPrompt(
        'Why does the salon app show prices in euros after I log in?',
      ),
    ).toBe(false);
  });

  it('rescues misclassified package and gift-card currency prompts', () => {
    expect(
      rescuePackageCurrencyIntent(
        'Why is the spa package total in dollars?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_package_currency',
      rescueReason: 'explain_package_currency',
    });
  });

  it('does not steal gift-card notification email currency prompts', () => {
    expect(
      isExplainPackageCurrencyPrompt(
        'Why does the gift card purchase email show dollars?',
      ),
    ).toBe(false);
  });

  it('recognizes package currency intent id', () => {
    expect(isPackageCurrencyIntent('explain_package_currency')).toBe(true);
    expect(isPackageCurrencyIntent('explain_checkout_currency')).toBe(false);
  });

  it.each(
    CATALOG_NOTIFY_DASHBOARD_SCENARIOS.filter((s) =>
      /[\u0530-\u058F]/.test(s.prompt),
    ).map((s) => [s.id, s.prompt] as const),
  )('does not steal catalog-notify mutate prompt %s', (_id, prompt) => {
    expect(isExplainPackageCurrencyPrompt(prompt)).toBe(false);
    expect(rescuePackageCurrencyIntent(prompt, 'unknown')).toBeNull();
  });
});
