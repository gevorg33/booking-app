import {
  BILLING_LOYALTY_DASHBOARD_PROMPT_FIXTURES,
  BILLING_LOYALTY_RESCUE_SCENARIOS,
  OPEN_BILLING_SETTINGS_PROMPTS,
  SUMMARIZE_LOYALTY_PROGRAM_PROMPTS,
} from './ai-billing-loyalty-dashboard.fixtures.js';
import { BILLING_LOYALTY_MULTILINGUAL_SCENARIOS } from './ai-billing-loyalty-dashboard-multilingual.fixtures.js';
import {
  enrichBillingLoyaltyRescueParams,
  isBillingLoyaltyDashboardIntent,
  isOpenBillingSettingsPrompt,
  isSummarizeLoyaltyProgramPrompt,
  rescueBillingLoyaltyDashboardIntent,
} from './ai-billing-loyalty-dashboard.util.js';

describe('ai-billing-loyalty-dashboard.util (ai-cmd-ext-2.9–2.10)', () => {
  it.each(BILLING_LOYALTY_DASHBOARD_PROMPT_FIXTURES)(
    'rescueBillingLoyaltyDashboardIntent $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueBillingLoyaltyDashboardIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(BILLING_LOYALTY_MULTILINGUAL_SCENARIOS)(
    'rescueBillingLoyaltyDashboardIntent multilingual $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueBillingLoyaltyDashboardIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(BILLING_LOYALTY_RESCUE_SCENARIOS)(
    'rescues misclassified billing/loyalty prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueBillingLoyaltyDashboardIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(OPEN_BILLING_SETTINGS_PROMPTS)(
    'isOpenBillingSettingsPrompt $id',
    ({ prompt }) => {
      expect(isOpenBillingSettingsPrompt(prompt)).toBe(true);
      expect(isSummarizeLoyaltyProgramPrompt(prompt)).toBe(false);
    },
  );

  it.each(SUMMARIZE_LOYALTY_PROGRAM_PROMPTS)(
    'isSummarizeLoyaltyProgramPrompt $id',
    ({ prompt }) => {
      expect(isSummarizeLoyaltyProgramPrompt(prompt)).toBe(true);
      expect(isOpenBillingSettingsPrompt(prompt)).toBe(false);
    },
  );

  it('does not classify customer loyalty balance as program summary', () => {
    expect(isSummarizeLoyaltyProgramPrompt('What is my loyalty balance')).toBe(
      false,
    );
  });

  it('detects HY/RU billing and loyalty prompts', () => {
    expect(isOpenBillingSettingsPrompt('Բացիր billing settings')).toBe(true);
    expect(isOpenBillingSettingsPrompt('Открой billing settings')).toBe(true);
    expect(isSummarizeLoyaltyProgramPrompt('Ամփոփիր loyalty program-ը')).toBe(
      true,
    );
    expect(isSummarizeLoyaltyProgramPrompt('Суммируй loyalty program')).toBe(
      true,
    );
  });

  it('isBillingLoyaltyDashboardIntent and enrichBillingLoyaltyRescueParams', () => {
    expect(isBillingLoyaltyDashboardIntent('open_billing_settings')).toBe(true);
    expect(isBillingLoyaltyDashboardIntent('summarize_loyalty_program')).toBe(
      true,
    );
    expect(isBillingLoyaltyDashboardIntent('unknown')).toBe(false);
    expect(
      enrichBillingLoyaltyRescueParams('open_billing_settings', {}, 'open'),
    ).toEqual({});
  });
});
