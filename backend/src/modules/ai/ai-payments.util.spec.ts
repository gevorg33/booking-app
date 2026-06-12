import { SIMILAR_CHECK_AND_BOOK_PROMPTS } from './ai-check-and-book.fixtures.js';
import {
  rescuePaymentsIntent,
  isPaymentsCompoundPrompt,
  decomposePaymentsCompoundPrompt,
  isSummarizeUnpaidPrompt,
  isValidateGiftCardPrompt,
  isExportAccountingPrompt,
  isExportCommissionsPrompt,
  isExplainCheckoutTotalPrompt,
  isListSubscriptionRevenuePrompt,
  isConfigureCashPaymentsPrompt,
  isAdjustGiftCardBalancePrompt,
  isExtendGiftCardExpiryPrompt,
  isRefundGiftCardOrderPrompt,
  isExplainPaymentStatusPrompt,
  isCollectCashConfirmPrompt,
  isCheckProvidersForServicePrompt,
  isBookNearestSlotPrompt,
  isApplyGiftCardCodePrompt,
  isCheckGiftCardBalancePrompt,
  isBuyGiftCardPrompt,
  isBuyGiftCardPhysicalPrompt,
  isChoosePaymentMethodPrompt,
  isPayOnlinePrompt,
  isPayCashAtVisitPrompt,
  isPurchaseSubscriptionCheckoutPrompt,
  isExplainWhyStripeRequiredPrompt,
  isReceiptStatusPrompt,
  extractGiftCardCodeFromPrompt,
  extractServiceNameFromPrompt,
  extractAmountFromPrompt,
  resolveAvailabilityDateKey,
  resolveTomorrowDateKey,
  notBeforeTimeFromWindow,
  parseCashPaymentsToggle,
  PAYMENTS_INTENTS,
  isPaymentsIntent,
} from './ai-payments.util.js';

describe('ai-payments.util', () => {
  describe('prompt classifiers', () => {
    it('detects dashboard payment read prompts', () => {
      expect(isSummarizeUnpaidPrompt('Summarize unpaid bookings')).toBe(true);
      expect(isSummarizeUnpaidPrompt('Show outstanding payments')).toBe(true);
      expect(isValidateGiftCardPrompt('Validate gift card GCM-ABCD')).toBe(
        true,
      );
      expect(isValidateGiftCardPrompt('Check gift card balance')).toBe(false);
      expect(isExportAccountingPrompt('Export accounting for May')).toBe(true);
      expect(isExportCommissionsPrompt('Export commission payout CSV')).toBe(
        true,
      );
      expect(isExplainCheckoutTotalPrompt('Explain checkout total')).toBe(true);
      expect(
        isListSubscriptionRevenuePrompt('List subscription revenue this month'),
      ).toBe(true);
    });

    it('detects dashboard payment mutate prompts', () => {
      expect(
        isConfigureCashPaymentsPrompt('Enable cash payments for checkout'),
      ).toBe(true);
      expect(
        isAdjustGiftCardBalancePrompt('Adjust gift card balance by $10'),
      ).toBe(true);
      expect(
        isExtendGiftCardExpiryPrompt('Extend gift card expiry 3 months'),
      ).toBe(true);
      expect(
        isRefundGiftCardOrderPrompt('Refund gift card order GCM-ABCD'),
      ).toBe(true);
    });

    it('detects provider payment prompts', () => {
      expect(
        isExplainPaymentStatusPrompt('Explain payment status for booking'),
      ).toBe(true);
      expect(isCollectCashConfirmPrompt('Confirm cash payment received')).toBe(
        true,
      );
    });

    it('detects customer checkout prompts', () => {
      expect(
        isCheckProvidersForServicePrompt(
          'Who is available tomorrow evening for massage',
        ),
      ).toBe(true);
      expect(
        isCheckProvidersForServicePrompt(
          'check who is free tomorrow evening for permanent lashes',
        ),
      ).toBe(true);
      expect(
        isCheckProvidersForServicePrompt('check who is available for massage'),
      ).toBe(true);
      expect(
        isCheckProvidersForServicePrompt('who is available for packages'),
      ).toBe(false);
      expect(
        isCheckProvidersForServicePrompt(
          'who is available for membership plans',
        ),
      ).toBe(false);
      expect(extractServiceNameFromPrompt('for the')).toBeNull();
      expect(
        isCheckProvidersForServicePrompt(
          'Check multi-service block availability',
        ),
      ).toBe(false);
      expect(isBookNearestSlotPrompt('Book nearest haircut slot')).toBe(true);
      expect(isApplyGiftCardCodePrompt('Apply my gift card at checkout')).toBe(
        true,
      );
      expect(
        isCheckGiftCardBalancePrompt(
          'Check gift card balance by code GCM-ABCD',
        ),
      ).toBe(true);
      expect(isBuyGiftCardPrompt('Buy a $50 gift card')).toBe(true);
      expect(
        isBuyGiftCardPhysicalPrompt('Buy physical gift card shipped'),
      ).toBe(true);
      expect(
        isChoosePaymentMethodPrompt(
          'Which payment method can I use at checkout',
        ),
      ).toBe(true);
      expect(isPayOnlinePrompt('Pay online with card')).toBe(true);
      expect(isPayCashAtVisitPrompt('Pay cash at visit')).toBe(true);
      expect(
        isPurchaseSubscriptionCheckoutPrompt(
          'Purchase subscription plan checkout',
        ),
      ).toBe(true);
      expect(isExplainWhyStripeRequiredPrompt('Why is Stripe required')).toBe(
        true,
      );
      expect(isReceiptStatusPrompt('Receipt status for my booking')).toBe(true);
    });
  });

  describe('extractors and helpers', () => {
    it('extracts gift card codes, service names, amounts, and date windows', () => {
      expect(extractGiftCardCodeFromPrompt('Apply code GCM-ABCD1234')).toBe(
        'GCM-ABCD1234',
      );
      expect(extractGiftCardCodeFromPrompt('Use "GCB-SPECIAL"')).toBe(
        'GCB-SPECIAL',
      );
      expect(extractGiftCardCodeFromPrompt('no code here')).toBeNull();
      expect(
        extractServiceNameFromPrompt('Who is available for massage tomorrow'),
      ).toBe('massage');
      expect(extractServiceNameFromPrompt('"Haircut" tomorrow evening')).toBe(
        'Haircut',
      );
      expect(extractServiceNameFromPrompt('Book nearest facial slot')).toBe(
        'facial',
      );
      expect(
        extractServiceNameFromPrompt('please book a facemassage nearest slot'),
      ).toBe('facemassage');
      expect(
        extractServiceNameFromPrompt(
          'book hairstyle tomorrow who is free at nearest time',
        ),
      ).toBe('hairstyle');
      expect(
        extractServiceNameFromPrompt(
          'check who is available tomorrow for massage and book first available slot',
        ),
      ).toBe('massage');
      expect(
        extractServiceNameFromPrompt(
          'check who is free tomorrow evening for permanent lashes, book the nearest slot',
        ),
      ).toBe('permanent lashes');
      expect(extractAmountFromPrompt('Buy $75 gift card')).toBe(75);
      expect(extractAmountFromPrompt('amount 100')).toBe(100);
      expect(extractAmountFromPrompt('no amount')).toBeNull();
      expect(resolveTomorrowDateKey(new Date('2026-06-05T12:00:00Z'))).toBe(
        '2026-06-06',
      );
      expect(
        resolveAvailabilityDateKey(
          { date: '09/06/2026' },
          'which time is available tomorrow evening for hair coloring',
          'UTC',
        ),
      ).toBe('2026-06-09');
      expect(
        resolveAvailabilityDateKey({ date: '09/06/2026' }, undefined, 'UTC'),
      ).toBe('2026-06-09');
      expect(notBeforeTimeFromWindow('evening massage', {})).toBe('17:00');
      expect(notBeforeTimeFromWindow('afternoon', {})).toBe('12:00');
      expect(notBeforeTimeFromWindow('morning', {})).toBe('00:00');
      expect(
        notBeforeTimeFromWindow('no window', { notBeforeTime: '14:00' }),
      ).toBe('14:00');
      expect(parseCashPaymentsToggle('Enable cash payments')).toBe(true);
      expect(parseCashPaymentsToggle('Disable cash payments')).toBe(false);
      expect(parseCashPaymentsToggle('cash payments')).toBeNull();
    });
  });

  describe('rescuePaymentsIntent', () => {
    it('rescues all payments intents from unknown', () => {
      expect(
        rescuePaymentsIntent('Summarize unpaid bookings', 'unknown')?.action,
      ).toBe('summarize_unpaid');
      expect(
        rescuePaymentsIntent('Validate gift card GCM-ABCD', 'unknown')?.action,
      ).toBe('validate_gift_card');
      expect(
        rescuePaymentsIntent('Export accounting ledger', 'unknown')?.action,
      ).toBe('export_accounting');
      expect(
        rescuePaymentsIntent('Export commission payout', 'unknown')?.action,
      ).toBe('export_commissions');
      expect(
        rescuePaymentsIntent('Explain checkout total', 'unknown')?.action,
      ).toBe('explain_checkout_total');
      expect(
        rescuePaymentsIntent('List subscription revenue', 'unknown')?.action,
      ).toBe('list_subscription_revenue');
      expect(
        rescuePaymentsIntent('Enable cash payments', 'unknown')?.action,
      ).toBe('configure_cash_payments');
      expect(
        rescuePaymentsIntent('Adjust gift card balance', 'unknown')?.action,
      ).toBe('adjust_gift_card_balance');
      expect(
        rescuePaymentsIntent('Extend gift card expiry', 'unknown')?.action,
      ).toBe('extend_gift_card_expiry');
      expect(
        rescuePaymentsIntent('Refund gift card order', 'unknown')?.action,
      ).toBe('refund_gift_card_order');
      expect(
        rescuePaymentsIntent('Explain payment status', 'unknown')?.action,
      ).toBe('explain_payment_status');
      expect(
        rescuePaymentsIntent('Confirm cash payment received', 'unknown')
          ?.action,
      ).toBe('collect_cash_confirm');
      expect(
        rescuePaymentsIntent(
          'Who is available tomorrow evening for massage',
          'unknown',
        )?.action,
      ).toBe('check_providers_for_service');
      expect(
        rescuePaymentsIntent('Book nearest haircut slot', 'unknown')?.action,
      ).toBe('book_nearest_slot');
      expect(
        rescuePaymentsIntent('Apply gift card at checkout', 'unknown')?.action,
      ).toBe('apply_gift_card_code');
      expect(
        rescuePaymentsIntent('Check gift card balance by code', 'unknown')
          ?.action,
      ).toBe('check_gift_card_balance');
      expect(rescuePaymentsIntent('Buy gift card $50', 'unknown')?.action).toBe(
        'buy_gift_card',
      );
      expect(
        rescuePaymentsIntent('Buy physical gift card', 'unknown')?.action,
      ).toBe('buy_gift_card_physical');
      expect(
        rescuePaymentsIntent('Choose payment method', 'unknown')?.action,
      ).toBe('choose_payment_method');
      expect(rescuePaymentsIntent('Pay online now', 'unknown')?.action).toBe(
        'pay_online',
      );
      expect(rescuePaymentsIntent('Pay cash at visit', 'unknown')?.action).toBe(
        'pay_cash_at_visit',
      );
      expect(
        rescuePaymentsIntent('Purchase subscription checkout', 'unknown')
          ?.action,
      ).toBe('purchase_subscription_checkout');
      expect(
        rescuePaymentsIntent('Why is Stripe required', 'unknown')?.action,
      ).toBe('explain_why_stripe_required');
      expect(rescuePaymentsIntent('Receipt status', 'unknown')?.action).toBe(
        'receipt_status',
      );
    });

    it('rescues check_gift_card_balance over gift_card_balance', () => {
      expect(
        rescuePaymentsIntent(
          'Check gift card balance by code GCM-ABCD',
          'gift_card_balance',
        )?.action,
      ).toBe('check_gift_card_balance');
    });

    it('skips rescue when action already matches or compound', () => {
      expect(
        rescuePaymentsIntent('Summarize unpaid', 'summarize_unpaid'),
      ).toBeNull();
      expect(
        rescuePaymentsIntent(
          'Check who is available tomorrow evening for massage and book nearest slot',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescuePaymentsIntent(
          'Check who is available tomorrow evening for massage and book nearest slot',
          'compound_intent',
        )?.action,
      ).toBe('check_providers_for_service');
      expect(rescuePaymentsIntent('hello world', 'unknown')).toBeNull();
      expect(
        rescuePaymentsIntent('Track my physical gift card order', 'unknown'),
      ).toBeNull();
    });
  });

  describe('compound decomposition', () => {
    it.each(SIMILAR_CHECK_AND_BOOK_PROMPTS)(
      'decomposes similar phrasing: $id',
      ({ prompt, serviceName, notBeforeTime }) => {
        expect(isCheckProvidersForServicePrompt(prompt)).toBe(true);
        expect(isPaymentsCompoundPrompt(prompt)).toBe(true);
        const steps = decomposePaymentsCompoundPrompt(prompt);
        expect(steps.map((s) => s.action)).toEqual([
          'check_providers_for_service',
          'book_nearest_slot',
        ]);
        expect(steps[0]?.params.serviceName).toBe(serviceName);
        expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
        if (notBeforeTime) {
          expect(steps[0]?.params.notBeforeTime).toBe(notBeforeTime);
        }
      },
    );

    it('decomposes multi-command payment prompts', () => {
      const prompt =
        'Check who is available tomorrow evening for massage and book the nearest slot and apply my gift card';
      expect(isPaymentsCompoundPrompt(prompt)).toBe(true);
      const steps = decomposePaymentsCompoundPrompt(prompt);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.map((s) => s.action)).toContain(
        'check_providers_for_service',
      );
      expect(steps.map((s) => s.action)).toContain('book_nearest_slot');

      const freePrompt =
        'check who is free tomorrow evening for permanent lashes, book the nearest slot';
      expect(isCheckProvidersForServicePrompt(freePrompt)).toBe(true);
      expect(isPaymentsCompoundPrompt(freePrompt)).toBe(true);
      const freeSteps = decomposePaymentsCompoundPrompt(freePrompt);
      expect(freeSteps.map((s) => s.action)).toEqual([
        'check_providers_for_service',
        'book_nearest_slot',
      ]);
      expect(freeSteps[0]?.params.serviceName).toBe('permanent lashes');
      expect(freeSteps[0]?.params.date).toBe(resolveTomorrowDateKey());
      expect(freeSteps[0]?.params.notBeforeTime).toBe('17:00');
      expect(freeSteps[1]?.params.bookingFirstAvailable).toBe(true);

      const inline = decomposePaymentsCompoundPrompt(
        'Who is free tomorrow evening for permanent lashes book the nearest slot',
      );
      expect(inline.map((s) => s.action)).toEqual([
        'check_providers_for_service',
        'book_nearest_slot',
      ]);
      expect(inline[0]?.params.notBeforeTime).toBe('17:00');

      const haircut = decomposePaymentsCompoundPrompt(
        'Book nearest haircut and apply gift card if available',
      );
      expect(haircut.map((s) => s.action)).toEqual([
        'book_nearest_slot',
        'apply_gift_card_code',
      ]);

      const semicolon = decomposePaymentsCompoundPrompt(
        'Summarize unpaid; export accounting',
      );
      expect(semicolon.map((s) => s.action)).toEqual([
        'summarize_unpaid',
        'export_accounting',
      ]);

      const thenSplit = decomposePaymentsCompoundPrompt(
        'Choose payment method then pay online',
      );
      expect(thenSplit.map((s) => s.action)).toContain('choose_payment_method');
      expect(thenSplit.map((s) => s.action)).toContain('pay_online');

      const physical = decomposePaymentsCompoundPrompt(
        'Buy physical gift card $100',
      );
      expect(physical[0]?.action).toBe('buy_gift_card_physical');

      const partial = decomposePaymentsCompoundPrompt(
        'Summarize unpaid and list foobar widgets',
      );
      expect(partial).toHaveLength(1);
    });

    it('returns empty for unclassifiable prompts', () => {
      expect(decomposePaymentsCompoundPrompt('')).toEqual([]);
      expect(decomposePaymentsCompoundPrompt('hello world')).toEqual([]);
      expect(isPaymentsCompoundPrompt('hi')).toBe(false);
      expect(decomposePaymentsCompoundPrompt('Summarize unpaid')).toHaveLength(
        1,
      );
    });
  });

  describe('full classifier and rescue coverage', () => {
    it('covers remaining prompt classifiers and rescue branches', () => {
      expect(isExplainPaymentStatusPrompt('payment status for booking')).toBe(
        true,
      );
      expect(isCollectCashConfirmPrompt('received cash payment')).toBe(true);
      expect(isPayOnlinePrompt('checkout online')).toBe(true);
      expect(isReceiptStatusPrompt('invoice email status')).toBe(true);
      expect(
        rescuePaymentsIntent('Disable cash payments at checkout', 'unknown')
          ?.action,
      ).toBe('configure_cash_payments');
      expect(
        rescuePaymentsIntent('Pay online with Stripe', 'unknown')?.action,
      ).toBe('pay_online');
      expect(
        rescuePaymentsIntent('Receipt email status', 'unknown')?.action,
      ).toBe('receipt_status');
      expect(
        rescuePaymentsIntent('Why Stripe required for card', 'unknown')?.action,
      ).toBe('explain_why_stripe_required');
      expect(
        rescuePaymentsIntent('Purchase membership plan checkout', 'unknown')
          ?.action,
      ).toBe('purchase_subscription_checkout');
      expect(
        rescuePaymentsIntent('Pay cash at visit please', 'unknown')?.action,
      ).toBe('pay_cash_at_visit');
      expect(
        rescuePaymentsIntent('Which payment options at checkout', 'unknown')
          ?.action,
      ).toBe('choose_payment_method');
      expect(
        rescuePaymentsIntent('Buy $100 gift card digital', 'unknown')?.action,
      ).toBe('buy_gift_card');
      expect(
        rescuePaymentsIntent('Buy mailed physical gift card', 'unknown')
          ?.action,
      ).toBe('buy_gift_card_physical');
      expect(
        rescuePaymentsIntent('Check gift card code GCM-TEST balance', 'unknown')
          ?.action,
      ).toBe('check_gift_card_balance');
      expect(
        rescuePaymentsIntent('Apply code GCM-TEST at checkout', 'unknown')
          ?.action,
      ).toBe('apply_gift_card_code');
      expect(
        rescuePaymentsIntent('Collect cash payment from client', 'unknown')
          ?.action,
      ).toBe('collect_cash_confirm');
      expect(
        rescuePaymentsIntent('Explain payment status booking b1', 'unknown')
          ?.action,
      ).toBe('explain_payment_status');
      expect(
        rescuePaymentsIntent('Refund gift card purchase order', 'unknown')
          ?.action,
      ).toBe('refund_gift_card_order');
      expect(
        rescuePaymentsIntent('Extend gift card expiration 6 months', 'unknown')
          ?.action,
      ).toBe('extend_gift_card_expiry');
      expect(
        rescuePaymentsIntent('Adjust gift card balance $20', 'unknown')?.action,
      ).toBe('adjust_gift_card_balance');
    });

    it('decomposes all compound segment types', () => {
      const all = decomposePaymentsCompoundPrompt(
        'Summarize unpaid and validate gift card and export accounting and export commissions',
      );
      expect(all.map((s) => s.action)).toEqual([
        'summarize_unpaid',
        'validate_gift_card',
        'export_accounting',
        'export_commissions',
      ]);

      const checkout = decomposePaymentsCompoundPrompt(
        'Explain checkout total and list subscription revenue and configure cash payments and adjust gift card balance',
      );
      expect(checkout.length).toBe(4);

      const mutate = decomposePaymentsCompoundPrompt(
        'Extend gift card expiry and refund gift card order and explain payment status and collect cash confirm',
      );
      expect(mutate.length).toBe(4);

      const customer = decomposePaymentsCompoundPrompt(
        'Check providers for massage tomorrow evening and book nearest haircut and apply gift card and check gift card balance',
      );
      expect(customer.length).toBeGreaterThanOrEqual(3);

      const pay = decomposePaymentsCompoundPrompt(
        'Buy gift card $50 and buy physical gift card and choose payment method and pay online',
      );
      expect(pay.length).toBeGreaterThanOrEqual(3);

      const tail = decomposePaymentsCompoundPrompt(
        'Pay cash at visit and purchase subscription checkout and explain why stripe required and receipt status',
      );
      expect(tail.length).toBe(4);
      expect(
        decomposePaymentsCompoundPrompt(
          'Explain why stripe required for checkout',
        )[0]?.action,
      ).toBe('explain_why_stripe_required');
      expect(
        decomposePaymentsCompoundPrompt('Explain checkout total for massage')[0]
          ?.action,
      ).toBe('explain_checkout_total');
      expect(notBeforeTimeFromWindow('', {})).toBeNull();
      expect(isBookNearestSlotPrompt('book something random')).toBe(false);
      expect(isBookNearestSlotPrompt('nearest slot available')).toBe(false);
      expect(isPayOnlinePrompt('Explain why stripe is required')).toBe(false);
      expect(isPayOnlinePrompt('Pay online now')).toBe(true);
      expect(extractGiftCardCodeFromPrompt('"SECRET"')).toBeNull();
      expect(
        extractGiftCardCodeFromPrompt('Use "GCB-SPECIAL" for gift card'),
      ).toBe('GCB-SPECIAL');
      expect(extractGiftCardCodeFromPrompt('Apply gift card "MYCODE12"')).toBe(
        'MYCODE12',
      );
      expect(isBookNearestSlotPrompt('nearest haircut appointment')).toBe(
        false,
      );
      expect(isBookNearestSlotPrompt('book nearest "Spa Day"')).toBe(true);
      expect(isBookNearestSlotPrompt('book nearest slot')).toBe(true);
      expect(isBookNearestSlotPrompt('book first available slot')).toBe(true);
      expect(isBookNearestSlotPrompt('reserve the nearest slot')).toBe(true);
      expect(
        isBookNearestSlotPrompt('schedule the next available appointment'),
      ).toBe(true);
      expect(isBookNearestSlotPrompt('book ASAP for massage')).toBe(true);
      expect(
        isCheckProvidersForServicePrompt(
          'anyone free tomorrow for permanent lashes',
        ),
      ).toBe(true);
      expect(
        isCheckProvidersForServicePrompt(
          'see who is open tomorrow for massage',
        ),
      ).toBe(true);
      expect(
        isCheckProvidersForServicePrompt(
          'check who can take permanent lashes tomorrow',
        ),
      ).toBe(true);
      expect(
        extractServiceNameFromPrompt(
          'check who can take permanent lashes tomorrow evening',
        ),
      ).toBe('permanent lashes');
      expect(
        extractServiceNameFromPrompt('who can take slot tomorrow'),
      ).toBeNull();
      expect(
        isCheckProvidersForServicePrompt(
          'who is available for spa packages tomorrow',
        ),
      ).toBe(false);
      expect(isBookNearestSlotPrompt('find nearest haircut')).toBe(true);
      expect(isBookNearestSlotPrompt('get next facial service')).toBe(true);
      expect(
        decomposePaymentsCompoundPrompt(
          'Summarize unpaid; ; export accounting',
        ).map((s) => s.action),
      ).toEqual(['summarize_unpaid', 'export_accounting']);

      const applyFallback = decomposePaymentsCompoundPrompt(
        'apply gift card GCM-ABCD and pay cash at visit',
      );
      expect(applyFallback[0]?.action).toBe('apply_gift_card_code');
    });
  });

  it('registers payments intents', () => {
    for (const intent of PAYMENTS_INTENTS) {
      expect(isPaymentsIntent(intent)).toBe(true);
    }
    expect(isPaymentsIntent('create_booking')).toBe(false);
  });
});
