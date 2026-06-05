import {
  rescueCustomerCrmIntent,
  isCrmCompoundPrompt,
  decomposeCrmCompoundPrompt,
  isListCustomerSubscriptionsPrompt,
  isSubscriptionUsageHistoryPrompt,
  isExtendSubscriptionPrompt,
  isCancelSubscriptionAdminPrompt,
  isListCustomerGiftCardsPrompt,
  isListCustomerBookingsPrompt,
  isMergeCustomersPrompt,
  isExportCustomerDataPrompt,
  isDeleteCustomerDataPrompt,
  isSendReengagementPrompt,
  isTagCustomerPrompt,
  isCustomerNoShowHistoryPrompt,
  isMyProfilePrompt,
  isMyAppointmentsPrompt,
  isMySubscriptionsPrompt,
  isSubscriptionUsagePrompt,
  isMyGiftCardsPrompt,
  isGiftCardBalancePrompt,
  isGiftCardRedemptionHistoryPrompt,
  isRequestGiftCardCancelPrompt,
  isRequestGiftCardModifyPrompt,
  isTrackPhysicalGiftCardPrompt,
  isPrivacyExportPrompt,
  isPrivacyDeletePrompt,
  isDiscoverPackagesPrompt,
  isDiscoverSubscriptionPlansPrompt,
  isDiscoverGiftCardProductsPrompt,
  hasDashboardCustomerReference,
  extractCustomerNameFromPrompt,
  extractTagFromPrompt,
  extractExtendMonths,
  extractGiftCardCode,
  CUSTOMER_CRM_INTENTS,
  isCustomerCrmIntent,
} from './ai-customer-crm.util.js';

describe('ai-customer-crm.util', () => {
  describe('prompt classifiers', () => {
    it('detects dashboard CRM read prompts', () => {
      expect(
        isListCustomerSubscriptionsPrompt("List Anna's subscriptions"),
      ).toBe(true);
      expect(
        isListCustomerSubscriptionsPrompt('Show subscriptions for Anna'),
      ).toBe(true);
      expect(isListCustomerSubscriptionsPrompt('Show my subscriptions')).toBe(
        false,
      );
      expect(
        isSubscriptionUsageHistoryPrompt('Usage history for Anna nail plan'),
      ).toBe(true);
      expect(isListCustomerGiftCardsPrompt("Show Anna's gift cards")).toBe(
        true,
      );
      expect(isListCustomerBookingsPrompt('List appointments for Anna')).toBe(
        true,
      );
      expect(isListCustomerBookingsPrompt('List package visits for Anna')).toBe(
        false,
      );
      expect(isCustomerNoShowHistoryPrompt('Anna no-show history')).toBe(true);
      expect(hasDashboardCustomerReference("Anna's subscriptions")).toBe(true);
      expect(hasDashboardCustomerReference('show her gift cards')).toBe(true);
    });

    it('detects dashboard CRM mutate prompts', () => {
      expect(isExtendSubscriptionPrompt('Extend Anna nail plan 3 months')).toBe(
        true,
      );
      expect(
        isCancelSubscriptionAdminPrompt('Cancel subscription for Anna'),
      ).toBe(true);
      expect(isCancelSubscriptionAdminPrompt('Cancel my subscription')).toBe(
        false,
      );
      expect(isMergeCustomersPrompt('Merge duplicate customers')).toBe(true);
      expect(isExportCustomerDataPrompt('Export customer data for Anna')).toBe(
        true,
      );
      expect(isExportCustomerDataPrompt('Export my data')).toBe(false);
      expect(isDeleteCustomerDataPrompt('Delete customer data Anna')).toBe(
        true,
      );
      expect(
        isSendReengagementPrompt('Send re-engagement message to Anna'),
      ).toBe(true);
      expect(isTagCustomerPrompt('Tag Anna as VIP')).toBe(true);
    });

    it('detects customer account prompts', () => {
      expect(isMyProfilePrompt('Show my profile')).toBe(true);
      expect(isMyAppointmentsPrompt('Show my appointments')).toBe(true);
      expect(isMySubscriptionsPrompt('Show my subscriptions')).toBe(true);
      expect(isSubscriptionUsagePrompt('My subscription usage remaining')).toBe(
        true,
      );
      expect(isMyGiftCardsPrompt('Show my gift cards')).toBe(true);
      expect(isGiftCardBalancePrompt('Gift card balance left')).toBe(true);
      expect(
        isGiftCardRedemptionHistoryPrompt('Gift card redemption history'),
      ).toBe(true);
      expect(isRequestGiftCardCancelPrompt('Cancel my gift card order')).toBe(
        true,
      );
      expect(
        isRequestGiftCardCancelPrompt('request cancel gift card order'),
      ).toBe(true);
      expect(isRequestGiftCardModifyPrompt('Modify my gift card order')).toBe(
        true,
      );
      expect(
        isRequestGiftCardModifyPrompt('request change gift card order'),
      ).toBe(true);
      expect(
        isTrackPhysicalGiftCardPrompt('Track physical gift card shipment'),
      ).toBe(true);
      expect(isPrivacyExportPrompt('Export my personal data')).toBe(true);
      expect(isPrivacyDeletePrompt('Delete my account data')).toBe(true);
    });

    it('detects discovery prompts', () => {
      expect(isDiscoverPackagesPrompt('What packages are available?')).toBe(
        true,
      );
      expect(isDiscoverPackagesPrompt('list package visits this week')).toBe(
        false,
      );
      expect(isDiscoverPackagesPrompt('Create package Spa Day')).toBe(false);
      expect(
        isDiscoverSubscriptionPlansPrompt(
          'What membership plans are available',
        ),
      ).toBe(true);
      expect(
        isDiscoverGiftCardProductsPrompt('What gift cards can I buy'),
      ).toBe(true);
      expect(isDiscoverGiftCardProductsPrompt("Show Anna's gift cards")).toBe(
        false,
      );
    });
  });

  describe('extractors', () => {
    it('extracts customer names, tags, months, and codes', () => {
      expect(extractCustomerNameFromPrompt("List Anna's subscriptions")).toBe(
        'Anna',
      );
      expect(
        extractCustomerNameFromPrompt('subscriptions for Maria Lopez'),
      ).toBe('Maria Lopez');
      expect(extractCustomerNameFromPrompt('Tag Anna Lopez as VIP')).toBe(
        'Anna Lopez',
      );
      expect(
        extractCustomerNameFromPrompt('customer John Smith bookings'),
      ).toBe('John Smith');
      expect(extractTagFromPrompt('Tag Anna as VIP')).toBe('vip');
      expect(extractTagFromPrompt('mark client at-risk')).toBe('at_risk');
      expect(extractExtendMonths('extend 6 months')).toBe(6);
      expect(extractExtendMonths('extend soon')).toBeUndefined();
      expect(extractGiftCardCode('balance on GIFT1234')).toBe('GIFT1234');
      expect(extractGiftCardCode('no code here')).toBeNull();
      expect(extractTagFromPrompt('tag someone')).toBeNull();
    });
  });

  describe('rescueCustomerCrmIntent', () => {
    it('rescues all CRM intents from unknown', () => {
      expect(
        rescueCustomerCrmIntent("List Anna's subscriptions", 'unknown')?.action,
      ).toBe('list_customer_subscriptions');
      expect(
        rescueCustomerCrmIntent('Usage history nail plan for Anna', 'unknown')
          ?.action,
      ).toBe('subscription_usage_history');
      expect(
        rescueCustomerCrmIntent('Extend Anna nail plan 2 months', 'unknown')
          ?.action,
      ).toBe('extend_subscription');
      expect(
        rescueCustomerCrmIntent('Cancel subscription for Anna', 'unknown')
          ?.action,
      ).toBe('cancel_subscription_admin');
      expect(
        rescueCustomerCrmIntent("Show Anna's gift cards", 'unknown')?.action,
      ).toBe('list_customer_gift_cards');
      expect(
        rescueCustomerCrmIntent('List appointments for Anna', 'unknown')
          ?.action,
      ).toBe('list_customer_bookings');
      expect(
        rescueCustomerCrmIntent('Anna no-show history', 'unknown')?.action,
      ).toBe('customer_no_show_history');
      expect(
        rescueCustomerCrmIntent('Tag Anna as VIP', 'unknown')?.action,
      ).toBe('tag_customer');
      expect(
        rescueCustomerCrmIntent('Export customer data Anna', 'unknown')?.action,
      ).toBe('export_customer_data');
      expect(
        rescueCustomerCrmIntent('Delete customer data Anna', 'unknown')?.action,
      ).toBe('delete_customer_data');
      expect(
        rescueCustomerCrmIntent('Send win-back message to Anna', 'unknown')
          ?.action,
      ).toBe('send_reengagement_message');
      expect(
        rescueCustomerCrmIntent(
          'Merge duplicate customers Anna and Bob',
          'unknown',
        )?.action,
      ).toBe('merge_customers');
      expect(
        rescueCustomerCrmIntent('Show my profile', 'unknown')?.action,
      ).toBe('my_profile');
      expect(
        rescueCustomerCrmIntent('Show my appointments', 'unknown')?.action,
      ).toBe('my_appointments');
      expect(
        rescueCustomerCrmIntent('Show my subscriptions', 'unknown')?.action,
      ).toBe('my_subscriptions');
      expect(
        rescueCustomerCrmIntent('My subscription usage remaining', 'unknown')
          ?.action,
      ).toBe('subscription_usage');
      expect(
        rescueCustomerCrmIntent('Show my gift cards', 'unknown')?.action,
      ).toBe('my_gift_cards');
      expect(
        rescueCustomerCrmIntent('Gift card balance left', 'unknown')?.action,
      ).toBe('gift_card_balance');
      expect(
        rescueCustomerCrmIntent('Gift card redeemed history', 'unknown')
          ?.action,
      ).toBe('gift_card_redemption_history');
      expect(
        rescueCustomerCrmIntent('Cancel my gift card order', 'unknown')?.action,
      ).toBe('request_gift_card_cancel');
      expect(
        rescueCustomerCrmIntent('Modify my gift card order', 'unknown')?.action,
      ).toBe('request_gift_card_modify');
      expect(
        rescueCustomerCrmIntent('Track physical gift card shipment', 'unknown')
          ?.action,
      ).toBe('track_physical_gift_card_order');
      expect(
        rescueCustomerCrmIntent('Export my personal data', 'unknown')?.action,
      ).toBe('privacy_export');
      expect(
        rescueCustomerCrmIntent('Delete my account data', 'unknown')?.action,
      ).toBe('privacy_delete');
      expect(
        rescueCustomerCrmIntent('What packages are available?', 'unknown')
          ?.action,
      ).toBe('discover_packages');
      expect(
        rescueCustomerCrmIntent(
          'What membership plans are available',
          'unknown',
        )?.action,
      ).toBe('discover_subscription_plans');
      expect(
        rescueCustomerCrmIntent('What gift cards can I buy', 'unknown')?.action,
      ).toBe('discover_gift_card_products');
    });

    it('skips rescue when action already matches or compound', () => {
      expect(
        rescueCustomerCrmIntent('Show my appointments', 'my_appointments'),
      ).toBeNull();
      expect(
        rescueCustomerCrmIntent(
          'What packages are available?',
          'list_packages',
        ),
      ).toBeNull();
      expect(
        rescueCustomerCrmIntent(
          'What gift cards can I buy',
          'configure_gift_card_products',
        ),
      ).toBeNull();
      expect(
        rescueCustomerCrmIntent(
          'List appointments for Anna',
          'lookup_customer',
        ),
      ).toBeNull();
      expect(
        rescueCustomerCrmIntent(
          "List Anna's subscriptions and show her gift cards",
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueCustomerCrmIntent(
          "List Anna's subscriptions and show her gift cards",
          'compound_intent',
        ),
      ).not.toBeNull();
    });
  });

  describe('compound decomposition', () => {
    it('decomposes multi-command CRM prompts', () => {
      const prompt = "List Anna's subscriptions and show her gift cards";
      expect(isCrmCompoundPrompt(prompt)).toBe(true);
      const steps = decomposeCrmCompoundPrompt(prompt);
      expect(steps).toHaveLength(2);
      expect(steps[0].action).toBe('list_customer_subscriptions');
      expect(steps[1].action).toBe('list_customer_gift_cards');
      expect(steps[1].params.customerName).toBe('Anna');
    });

    it('decomposes semicolon and discovery compound steps', () => {
      const steps = decomposeCrmCompoundPrompt(
        'Show my appointments; show my gift cards',
      );
      expect(steps.map((s) => s.action)).toEqual([
        'my_appointments',
        'my_gift_cards',
      ]);

      const discover = decomposeCrmCompoundPrompt(
        'What packages are available and what membership plans are available',
      );
      expect(discover.map((s) => s.action)).toContain('discover_packages');
      expect(discover.map((s) => s.action)).toContain(
        'discover_subscription_plans',
      );

      const crm = decomposeCrmCompoundPrompt(
        "Extend Anna's nail plan 2 months and export customer data for Anna",
      );
      expect(crm.map((s) => s.action)).toContain('extend_subscription');
      expect(crm.map((s) => s.action)).toContain('export_customer_data');

      const gift = decomposeCrmCompoundPrompt(
        'What gift cards can I buy and gift card balance left',
      );
      expect(gift.map((s) => s.action)).toContain(
        'discover_gift_card_products',
      );
      expect(gift.map((s) => s.action)).toContain('gift_card_balance');

      const bookings = decomposeCrmCompoundPrompt(
        'List appointments for Anna and tag Anna as VIP',
      );
      expect(bookings.map((s) => s.action)).toContain('list_customer_bookings');
      expect(bookings.map((s) => s.action)).toContain('tag_customer');

      const usage = decomposeCrmCompoundPrompt(
        'Usage history nail plan for Anna and show her gift cards',
      );
      expect(usage.map((s) => s.action)).toContain(
        'subscription_usage_history',
      );

      const partial = decomposeCrmCompoundPrompt(
        "List Anna's subscriptions and list foobar widgets",
      );
      expect(partial).toHaveLength(1);
    });

    it('returns empty for unclassifiable prompts', () => {
      expect(decomposeCrmCompoundPrompt('')).toEqual([]);
      expect(decomposeCrmCompoundPrompt('hello world')).toEqual([]);
      expect(isCrmCompoundPrompt('hi')).toBe(false);
      expect(
        decomposeCrmCompoundPrompt("List Anna's subscriptions"),
      ).toHaveLength(1);
    });
  });

  it('registers customerCrm intents', () => {
    for (const intent of CUSTOMER_CRM_INTENTS) {
      expect(isCustomerCrmIntent(intent)).toBe(true);
    }
    expect(isCustomerCrmIntent('create_booking')).toBe(false);
  });
});
