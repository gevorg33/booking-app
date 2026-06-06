import { EXPLAIN_NOTIFICATION_CURRENCY_PROMPTS } from './ai-notification-currency.fixtures.js';
import {
  isExplainNotificationCurrencyPrompt,
  isNotificationCurrencyIntent,
  rescueNotificationCurrencyIntent,
} from './ai-notification-currency.util.js';

describe('ai-notification-currency.util (ai-cmd-curr-9)', () => {
  it.each(EXPLAIN_NOTIFICATION_CURRENCY_PROMPTS)(
    'detects explain notification currency prompt $id',
    ({ prompt }) => {
      expect(isExplainNotificationCurrencyPrompt(prompt)).toBe(true);
    },
  );

  it('does not steal explain_checkout_total breakdown prompts', () => {
    expect(
      isExplainNotificationCurrencyPrompt(
        'Explain the checkout total in my confirmation email',
      ),
    ).toBe(false);
  });

  it('does not steal consumer app currency prompts', () => {
    expect(
      isExplainNotificationCurrencyPrompt(
        'Why does the salon app show prices in euros after I log in?',
      ),
    ).toBe(false);
  });

  it('does not steal public booking page currency prompts', () => {
    expect(
      isExplainNotificationCurrencyPrompt(
        'Why do prices show euros on the booking page?',
      ),
    ).toBe(false);
  });

  it('does not steal package checkout currency without notification channel', () => {
    expect(
      isExplainNotificationCurrencyPrompt(
        'Why is the spa package total in dollars?',
      ),
    ).toBe(false);
  });

  it('does not steal payment status prompts without currency cues', () => {
    expect(
      isExplainNotificationCurrencyPrompt('Explain payment status for booking'),
    ).toBe(false);
    expect(
      rescueNotificationCurrencyIntent(
        'Explain payment status for booking',
        'unknown',
      ),
    ).toBeNull();
  });

  it('does not rescue when action is already explain_notification_currency', () => {
    expect(
      rescueNotificationCurrencyIntent(
        'Why does my booking confirmation email show euros (€)?',
        'explain_notification_currency',
      ),
    ).toBeNull();
  });

  it('rescues misclassified notification currency prompts', () => {
    expect(
      rescueNotificationCurrencyIntent(
        'Why does my booking confirmation email show euros (€)?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_notification_currency',
      rescueReason: 'explain_notification_currency',
    });
  });

  it('recognizes notification currency intent id', () => {
    expect(isNotificationCurrencyIntent('explain_notification_currency')).toBe(
      true,
    );
    expect(isNotificationCurrencyIntent('explain_tenant_currency')).toBe(false);
  });
});
