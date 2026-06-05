import {
  rescueMarketingGrowthIntent,
  isMarketingGrowthCompoundPrompt,
  decomposeMarketingGrowthCompoundPrompt,
  isConfigureMarketingAutomationPrompt,
  isSummarizeAutomationPerformancePrompt,
  isTriggerReengagementPrompt,
  isSingleCustomerReengagementPrompt,
  isListInactiveCustomersPrompt,
  isExplainPlanLimitsPrompt,
  isSuggestUpgradePrompt,
  isToggleAnnualBillingPrompt,
  isSummarizeNewRegistrationsPrompt,
  isHowToDownloadAppPrompt,
  isSwitchToConsumerAppPrompt,
  isPromoCodeHelpPrompt,
  isLoyaltyPointsBalancePrompt,
  extractPromoCodeFromPrompt,
  extractInactiveDaysFromPrompt,
  extractReengagementPromoFromPrompt,
  extractAutomationToggleFromPrompt,
  formatEntitlementsSummary,
  buildConsumerAppDownloadGuidance,
  buildConsumerAppSwitchGuidance,
  MARKETING_GROWTH_INTENTS,
  isMarketingGrowthIntent,
} from './ai-marketing-growth.util.js';

describe('ai-marketing-growth.util', () => {
  describe('prompt classifiers', () => {
    it('detects dashboard marketing and billing prompts', () => {
      expect(
        isConfigureMarketingAutomationPrompt(
          'Configure marketing automation re-engagement',
        ),
      ).toBe(true);
      expect(
        isConfigureMarketingAutomationPrompt(
          'Configure marketing registration email notifications',
        ),
      ).toBe(false);
      expect(
        isSummarizeAutomationPerformancePrompt(
          'Summarize automation performance',
        ),
      ).toBe(true);
      expect(
        isTriggerReengagementPrompt(
          'Trigger re-engagement for inactive customers',
        ),
      ).toBe(true);
      expect(
        isSingleCustomerReengagementPrompt(
          'Send re-engagement message to Anna',
        ),
      ).toBe(true);
      expect(isListInactiveCustomersPrompt('List inactive customers')).toBe(
        true,
      );
      expect(isExplainPlanLimitsPrompt('Explain plan limits')).toBe(true);
      expect(isSuggestUpgradePrompt('Suggest upgrade for more seats')).toBe(
        true,
      );
      expect(isToggleAnnualBillingPrompt('Switch to annual billing')).toBe(
        true,
      );
      expect(
        isSummarizeNewRegistrationsPrompt(
          'Summarize new registrations this month',
        ),
      ).toBe(true);
    });

    it('detects customer marketing prompts', () => {
      expect(
        isHowToDownloadAppPrompt('How do I download the consumer app'),
      ).toBe(true);
      expect(isSwitchToConsumerAppPrompt('Switch to consumer app')).toBe(true);
      expect(isHowToDownloadAppPrompt('Switch to consumer app')).toBe(false);
      expect(isPromoCodeHelpPrompt('How do promo codes work')).toBe(true);
      expect(
        isLoyaltyPointsBalancePrompt('Check my loyalty points balance'),
      ).toBe(true);
    });
  });

  describe('extractors and helpers', () => {
    it('extracts promo, automation, and formatting fields', () => {
      expect(extractPromoCodeFromPrompt('validate SAVE10')).toBe('SAVE10');
      expect(extractPromoCodeFromPrompt('promo code WELCOME')).toBe('WELCOME');
      expect(extractPromoCodeFromPrompt('code "VIP20"')).toBe('VIP20');
      expect(extractInactiveDaysFromPrompt('inactive after 90 days')).toBe(90);
      expect(extractReengagementPromoFromPrompt('promo code WINBACK')).toBe(
        'WINBACK',
      );
      expect(extractAutomationToggleFromPrompt('enable re-engagement')).toBe(
        true,
      );
      expect(extractAutomationToggleFromPrompt('disable re-engagement')).toBe(
        false,
      );
      expect(extractAutomationToggleFromPrompt('no toggle')).toBeNull();
      expect(extractPromoCodeFromPrompt('no code')).toBeNull();
      expect(extractInactiveDaysFromPrompt('no days')).toBeNull();
      expect(extractReengagementPromoFromPrompt('no promo')).toBeNull();

      const formatted = formatEntitlementsSummary({
        tierName: 'Solo',
        tierId: 'solo',
        isPaid: false,
        limits: {
          maxProviderSeats: 1,
          aiCommandsPerMonth: 25,
          flags: {
            stripeConnect: false,
            promoCodes: false,
            loyalty: false,
            memberships: false,
            giftCards: false,
          },
        },
        usage: { providerSeats: 1, aiCommandsThisMonth: 20 },
        atLimit: { providerSeats: true, aiCommands: false },
      });
      expect(formatted).toContain('Solo');
      expect(formatted).toContain('at limit');
      expect(formatted).toContain('core scheduling only');

      const withFlags = formatEntitlementsSummary({
        tierName: 'Starter',
        tierId: 'starter',
        isPaid: true,
        limits: {
          maxProviderSeats: 5,
          aiCommandsPerMonth: 150,
          flags: {
            stripeConnect: true,
            promoCodes: true,
            loyalty: false,
            memberships: false,
            giftCards: false,
          },
        },
        usage: { providerSeats: 2, aiCommandsThisMonth: 10 },
        atLimit: { providerSeats: false, aiCommands: false },
      });
      expect(withFlags).toContain('stripeConnect');

      const aiAtLimit = formatEntitlementsSummary({
        tierName: 'Starter',
        tierId: 'starter',
        isPaid: true,
        limits: {
          maxProviderSeats: 5,
          aiCommandsPerMonth: 150,
          flags: {
            stripeConnect: true,
            promoCodes: true,
            loyalty: false,
            memberships: false,
            giftCards: false,
          },
        },
        usage: { providerSeats: 2, aiCommandsThisMonth: 150 },
        atLimit: { providerSeats: false, aiCommands: true },
      });
      expect(aiAtLimit).toContain('AI commands this month');
      expect(aiAtLimit).toContain('at limit');

      const download = buildConsumerAppDownloadGuidance({
        frontendUrl: 'https://app.test',
        iosAppUrl: 'https://apps.apple.com/app',
        androidAppUrl: 'https://play.google.com/store',
        businessSlug: 'salon',
      });
      expect(download.pwaUrl).toBe('https://app.test/book/salon');
      expect(download.iosUrl).toBe('https://apps.apple.com/app');
      expect(download.steps.length).toBeGreaterThan(2);

      const pwaOnly = buildConsumerAppDownloadGuidance({
        frontendUrl: 'https://app.test/',
      });
      expect(pwaOnly.iosUrl).toBeNull();
      expect(pwaOnly.summary).toContain('No native app links');

      const iosOnly = buildConsumerAppDownloadGuidance({
        frontendUrl: 'https://app.test',
        iosAppUrl: 'https://apps.apple.com/app',
      });
      expect(iosOnly.iosUrl).toBeTruthy();
      expect(iosOnly.androidUrl).toBeNull();

      const androidOnly = buildConsumerAppDownloadGuidance({
        frontendUrl: 'https://app.test',
        androidAppUrl: 'https://play.google.com/store',
      });
      expect(androidOnly.androidUrl).toBeTruthy();
      expect(androidOnly.iosUrl).toBeNull();

      const switchGuide = buildConsumerAppSwitchGuidance({
        frontendUrl: 'https://app.test',
        businessSlug: 'salon',
      });
      expect(switchGuide.deepLink).toBe('https://app.test/book/salon');
      expect(switchGuide.steps.length).toBe(3);
    });
  });

  describe('rescueMarketingGrowthIntent', () => {
    it('rescues all marketing/growth intents from unknown', () => {
      expect(
        rescueMarketingGrowthIntent('Configure marketing automation', 'unknown')
          ?.action,
      ).toBe('configure_marketing_automation');
      expect(
        rescueMarketingGrowthIntent(
          'Summarize automation performance',
          'unknown',
        )?.action,
      ).toBe('summarize_automation_performance');
      expect(
        rescueMarketingGrowthIntent('Trigger re-engagement', 'unknown')?.action,
      ).toBe('trigger_reengagement');
      expect(
        rescueMarketingGrowthIntent('List inactive customers', 'unknown')
          ?.action,
      ).toBe('list_inactive_customers');
      expect(
        rescueMarketingGrowthIntent('Explain plan limits', 'unknown')?.action,
      ).toBe('explain_plan_limits');
      expect(
        rescueMarketingGrowthIntent('Suggest upgrade', 'unknown')?.action,
      ).toBe('suggest_upgrade');
      expect(
        rescueMarketingGrowthIntent('Switch to annual billing', 'unknown')
          ?.action,
      ).toBe('toggle_annual_billing');
      expect(
        rescueMarketingGrowthIntent('Summarize new registrations', 'unknown')
          ?.action,
      ).toBe('summarize_new_registrations');
      expect(
        rescueMarketingGrowthIntent('How do I download the app', 'unknown')
          ?.action,
      ).toBe('how_to_download_app');
      expect(
        rescueMarketingGrowthIntent('Switch to consumer app', 'unknown')
          ?.action,
      ).toBe('switch_to_consumer_app');
      expect(
        rescueMarketingGrowthIntent('How do promo codes work', 'unknown')
          ?.action,
      ).toBe('promo_code_help');
      expect(
        rescueMarketingGrowthIntent('Check my loyalty points', 'unknown')
          ?.action,
      ).toBe('loyalty_points_balance');
    });

    it('skips rescue for customerCrm send_reengagement and integrations registration email', () => {
      expect(
        rescueMarketingGrowthIntent(
          'Send re-engagement message to Anna',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueMarketingGrowthIntent(
          'Configure marketing registration email notifications',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueMarketingGrowthIntent(
          'Configure marketing automation',
          'configure_marketing_automation',
        ),
      ).toBeNull();
      expect(
        rescueMarketingGrowthIntent(
          'Configure re-engagement and summarize automation performance',
          'compound_intent',
        ),
      ).toBeNull();
      expect(
        rescueMarketingGrowthIntent('Book a haircut tomorrow', 'unknown'),
      ).toBeNull();
    });
  });

  describe('compound decomposition', () => {
    it('detects marketing/growth compound prompts', () => {
      expect(
        isMarketingGrowthCompoundPrompt(
          'Configure re-engagement automation and summarize automation performance',
        ),
      ).toBe(true);
      expect(isMarketingGrowthCompoundPrompt('Explain plan limits')).toBe(
        false,
      );
      expect(isMarketingGrowthCompoundPrompt('short')).toBe(false);
    });

    it('decomposes compound prompts into steps', () => {
      const configureSummary = decomposeMarketingGrowthCompoundPrompt(
        'Configure re-engagement automation and summarize automation performance',
      );
      expect(configureSummary.map((s) => s.action)).toEqual([
        'configure_marketing_automation',
        'summarize_automation_performance',
      ]);

      const listTrigger = decomposeMarketingGrowthCompoundPrompt(
        'List inactive customers and trigger re-engagement',
      );
      expect(listTrigger.map((s) => s.action)).toEqual([
        'list_inactive_customers',
        'trigger_reengagement',
      ]);

      const planUpgrade = decomposeMarketingGrowthCompoundPrompt(
        'Explain plan limits and suggest upgrade',
      );
      expect(planUpgrade.map((s) => s.action)).toEqual([
        'explain_plan_limits',
        'suggest_upgrade',
      ]);

      const appLoyalty = decomposeMarketingGrowthCompoundPrompt(
        'How do I download the consumer app and check my loyalty points balance',
      );
      expect(appLoyalty.map((s) => s.action)).toEqual([
        'how_to_download_app',
        'loyalty_points_balance',
      ]);
    });

    it('covers intent registry and single-segment decomposition', () => {
      expect(MARKETING_GROWTH_INTENTS.length).toBe(12);
      expect(isMarketingGrowthIntent('explain_plan_limits')).toBe(true);
      expect(isMarketingGrowthIntent('not_real')).toBe(false);
      expect(decomposeMarketingGrowthCompoundPrompt('')).toEqual([]);
      expect(
        decomposeMarketingGrowthCompoundPrompt('unrelated prompt text only'),
      ).toEqual([]);
      expect(
        decomposeMarketingGrowthCompoundPrompt(
          'Explain plan limits; suggest upgrade',
        ),
      ).toHaveLength(2);
      expect(
        decomposeMarketingGrowthCompoundPrompt(
          'summarize new registrations this month',
        )[0].params.dateRange,
      ).toBe('this_month');
      expect(
        decomposeMarketingGrowthCompoundPrompt(
          'enable re-engagement 60 days',
        )[0].params,
      ).toMatchObject({
        reEngagementEnabled: true,
        inactiveDaysThreshold: 60,
      });
      expect(
        decomposeMarketingGrowthCompoundPrompt(
          'promo code help validate SAVE10',
        )[0].params.promoCode,
      ).toBe('SAVE10');
      expect(
        decomposeMarketingGrowthCompoundPrompt(
          'list inactive customers; random gibberish only here',
        ).length,
      ).toBe(1);
      expect(
        isTriggerReengagementPrompt(
          'Send re-engagement email to customer Maria',
        ),
      ).toBe(false);
      expect(
        isSingleCustomerReengagementPrompt('Reach out to customer with email'),
      ).toBe(true);
      expect(
        isSingleCustomerReengagementPrompt('Re-engage customer "Anna Smith"'),
      ).toBe(true);
      expect(
        isSingleCustomerReengagementPrompt('Re-engage customer Maria'),
      ).toBe(true);
      expect(
        isSingleCustomerReengagementPrompt(
          'Send re-engagement zendesk message',
        ),
      ).toBe(true);
      expect(
        buildConsumerAppDownloadGuidance({
          frontendUrl: 'https://app.test',
          androidAppUrl: 'https://play.google.com/store',
        }).summary,
      ).toContain('native app links');
      expect(isSingleCustomerReengagementPrompt('Bulk re-engagement run')).toBe(
        false,
      );
      expect(isLoyaltyPointsBalancePrompt('What is my loyalty balance')).toBe(
        true,
      );
      expect(isLoyaltyPointsBalancePrompt('Show loyalty points')).toBe(true);
      expect(isSuggestUpgradePrompt('Should I upgrade my plan')).toBe(true);
      expect(
        decomposeMarketingGrowthCompoundPrompt(
          'summarize new registrations this week',
        )[0].params.dateRange,
      ).toBe('this_week');
      expect(
        buildConsumerAppSwitchGuidance({
          frontendUrl: 'https://app.test',
          businessSlug: null,
        }).deepLink,
      ).toBe('https://app.test');
      expect(
        rescueMarketingGrowthIntent('Download the booking app', 'unknown')
          ?.action,
      ).toBe('how_to_download_app');
      expect(
        rescueMarketingGrowthIntent('Open consumer app', 'unknown')?.action,
      ).toBe('switch_to_consumer_app');
      expect(isMarketingGrowthCompoundPrompt('short')).toBe(false);
      expect(
        isToggleAnnualBillingPrompt('Enable yearly subscription billing'),
      ).toBe(true);
      expect(
        decomposeMarketingGrowthCompoundPrompt('switch to consumer app')[0]
          ?.action,
      ).toBe('switch_to_consumer_app');
      expect(
        decomposeMarketingGrowthCompoundPrompt('toggle annual billing plan')[0]
          ?.action,
      ).toBe('toggle_annual_billing');
      expect(
        decomposeMarketingGrowthCompoundPrompt(
          'explain plan limits; ; suggest upgrade',
        ).map((s) => s.action),
      ).toEqual(['explain_plan_limits', 'suggest_upgrade']);
    });
  });
});
