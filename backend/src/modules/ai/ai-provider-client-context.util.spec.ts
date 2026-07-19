import { PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS } from './ai-provider-client-context.fixtures.js';
import {
  extractClientNoteBodyFromPrompt,
  extractCustomerNameFromClientPrompt,
  formatProviderClientHistoryText,
  formatProviderClientIntakeText,
  formatProviderClientStaffNotesText,
  formatProviderClientSummaryText,
  formatProviderMultiServiceTimelineText,
  formatProviderPackageVisitContextText,
  formatProviderBookingPaymentBreakdownText,
  formatProviderDepositBalanceDueText,
  formatProviderRetailCartText,
  formatProviderCancelPolicyForClientText,
  formatProviderGiftCardRedemptionText,
  formatProviderTourGroupText,
  isAddClientNotePrompt,
  isExplainBookingPaymentBreakdownPrompt,
  isExplainDepositBalanceDuePrompt,
  isExplainGiftCardRedemptionPrompt,
  isExplainTourGroupOnBookingPrompt,
  isExplainRetailCartPrompt,
  isExplainCancelPolicyForClientPrompt,
  isExplainClientIntakePrompt,
  isExplainMultiServiceTimelinePrompt,
  isExplainPackageVisitContextPrompt,
  isListClientStaffNotesPrompt,
  isShowClientHistoryPrompt,
  isSummarizeClientPrompt,
  rescueProviderClientContextIntent,
  resolveClientNoteBody,
} from './ai-provider-client-context.util.js';

describe('ai-provider-client-context.util (prov-exp-1.6)', () => {
  it.each(PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS)(
    'rescueProviderClientContextIntent — $id',
    ({ prompt, expectedAction }) => {
      expect(rescueProviderClientContextIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
    },
  );

  it('detects summarize vs history vs note prompts', () => {
    expect(isSummarizeClientPrompt('Summarize this client')).toBe(true);
    expect(isShowClientHistoryPrompt("Show Jane's visit history")).toBe(true);
    expect(isAddClientNotePrompt('Add staff note: latex allergy')).toBe(true);
    expect(isSummarizeClientPrompt("Show Jane's visit history")).toBe(false);
  });

  it('detects list_client_staff_notes vs explain_client_intake prompts', () => {
    expect(isListClientStaffNotesPrompt('Show staff notes for this client')).toBe(
      true,
    );
    expect(isListClientStaffNotesPrompt('Any notes on Jane?')).toBe(true);
    expect(isListClientStaffNotesPrompt('List the customer notes for John')).toBe(
      true,
    );
    expect(isAddClientNotePrompt('Show staff notes for this client')).toBe(
      false,
    );

    expect(
      isExplainClientIntakePrompt('What does their pre-visit intake say?'),
    ).toBe(true);
    expect(
      isExplainClientIntakePrompt("Show Jane's pre-visit intake answers"),
    ).toBe(true);
    expect(
      isExplainClientIntakePrompt('Did they fill out the intake questionnaire?'),
    ).toBe(true);
    expect(isSummarizeClientPrompt('What does their pre-visit intake say?')).toBe(
      false,
    );
  });

  it('detects explain_package_visit_context vs explain_multi_service_timeline prompts (ai-cmd-provider-5.2.8/5.2.9)', () => {
    expect(
      isExplainPackageVisitContextPrompt('Which visit is this in her package?'),
    ).toBe(true);
    expect(
      isExplainPackageVisitContextPrompt('This is visit 2 of 6 facials, right?'),
    ).toBe(true);
    expect(
      isExplainMultiServiceTimelinePrompt("What's next after this blowdry?"),
    ).toBe(true);
    expect(isExplainMultiServiceTimelinePrompt('Spa day order')).toBe(true);
    expect(
      isExplainMultiServiceTimelinePrompt('Which service is first?'),
    ).toBe(true);
    expect(
      isExplainMultiServiceTimelinePrompt(
        'Gap between her two appointments?',
      ),
    ).toBe(true);
    expect(isSummarizeClientPrompt('Which visit is this in her package?')).toBe(
      false,
    );
  });

  it('detects explain_booking_payment_breakdown prompts (ai-cmd-provider-5.3.3)', () => {
    expect(
      isExplainBookingPaymentBreakdownPrompt(
        "What's the payment breakdown for this booking?",
      ),
    ).toBe(true);
    expect(
      isExplainBookingPaymentBreakdownPrompt(
        'Break down the total for this booking',
      ),
    ).toBe(true);
    expect(
      isExplainBookingPaymentBreakdownPrompt(
        'What discounts were applied to this booking?',
      ),
    ).toBe(true);
    expect(
      isExplainBookingPaymentBreakdownPrompt(
        'How much deposit is left on this booking?',
      ),
    ).toBe(true);
  });

  it('does not let explain_booking_payment_breakdown steal tax/status/setup intents', () => {
    expect(
      isExplainBookingPaymentBreakdownPrompt(
        'Explain the tax lines on this appointment payment breakdown',
      ),
    ).toBe(false);
    expect(
      isExplainBookingPaymentBreakdownPrompt('What is the payment status?'),
    ).toBe(false);
    expect(
      isExplainBookingPaymentBreakdownPrompt(
        'Accept online payment on public booking for Massage with 50% deposit',
      ),
    ).toBe(false);
  });

  it('detects explain_deposit_balance_due prompts (ai-cmd-provider-5.3.5)', () => {
    expect(
      isExplainDepositBalanceDuePrompt('How much is left at checkout?'),
    ).toBe(true);
    expect(
      isExplainDepositBalanceDuePrompt(
        'How much does she still owe on this booking?',
      ),
    ).toBe(true);
    expect(
      isExplainDepositBalanceDuePrompt("50% deposit — what's the rest due?"),
    ).toBe(true);
    expect(
      isExplainDepositBalanceDuePrompt(
        'Is there a balance due on this booking?',
      ),
    ).toBe(true);
  });

  it('does not let explain_deposit_balance_due steal the full breakdown intent', () => {
    expect(
      isExplainDepositBalanceDuePrompt(
        "What's the payment breakdown for this booking?",
      ),
    ).toBe(false);
    expect(
      isExplainDepositBalanceDuePrompt(
        'What discounts were applied to this booking?',
      ),
    ).toBe(false);
    expect(
      isExplainDepositBalanceDuePrompt(
        'Accept online payment on public booking for Massage with 50% deposit',
      ),
    ).toBe(false);
  });

  it('detects explain_gift_card_redemption prompts (ai-cmd-provider-5.12.3)', () => {
    expect(
      isExplainGiftCardRedemptionPrompt("She's paying with gift card — balance?"),
    ).toBe(true);
    expect(
      isExplainGiftCardRedemptionPrompt(
        'How much gift card balance does she have?',
      ),
    ).toBe(true);
    expect(
      isExplainGiftCardRedemptionPrompt("What's left on the gift card?"),
    ).toBe(true);
    expect(
      isExplainGiftCardRedemptionPrompt('How much is remaining on her gift card?'),
    ).toBe(true);
    expect(
      isExplainGiftCardRedemptionPrompt(
        'Gift card covered service only — is anything else owed?',
      ),
    ).toBe(true);
  });

  it('detects explain_tour_group_on_booking prompts (ai-cmd-provider-5.18.4)', () => {
    expect(isExplainTourGroupOnBookingPrompt('How many pax on this tour?')).toBe(
      true,
    );
    expect(isExplainTourGroupOnBookingPrompt('Group booking details')).toBe(
      true,
    );
    expect(
      isExplainTourGroupOnBookingPrompt('How many people are in this tour group?'),
    ).toBe(true);
    expect(
      isExplainTourGroupOnBookingPrompt("What's the pax count for this booking?"),
    ).toBe(true);
    expect(
      isExplainTourGroupOnBookingPrompt('Set pax count to 4 for this booking'),
    ).toBe(false);
    expect(
      isExplainTourGroupOnBookingPrompt("What's next after this blowdry?"),
    ).toBe(false);
  });

  it('does not let explain_gift_card_redemption steal unrelated prompts', () => {
    expect(
      isExplainGiftCardRedemptionPrompt(
        "What's the payment breakdown for this booking?",
      ),
    ).toBe(false);
    expect(
      isExplainGiftCardRedemptionPrompt('Is there a balance due on this booking?'),
    ).toBe(false);
    expect(
      isExplainGiftCardRedemptionPrompt('Buy a gift card for Maria'),
    ).toBe(false);
    expect(
      isExplainGiftCardRedemptionPrompt('Show gift card creation queue'),
    ).toBe(false);
  });

  it('detects explain_retail_cart prompts (ai-cmd-provider-5.4.3)', () => {
    expect(isExplainRetailCartPrompt("What's on the retail tab?")).toBe(true);
    expect(isExplainRetailCartPrompt('Total with products?')).toBe(true);
    expect(
      isExplainRetailCartPrompt('What products are on this booking?'),
    ).toBe(true);
    expect(
      isExplainRetailCartPrompt('Show me the retail cart for this booking'),
    ).toBe(true);
  });

  it('does not let explain_retail_cart steal add_retail_to_booking mutations', () => {
    expect(isExplainRetailCartPrompt('Add shampoo to this booking')).toBe(
      false,
    );
    expect(isExplainRetailCartPrompt('Sell conditioner on my booking')).toBe(
      false,
    );
    expect(
      isExplainRetailCartPrompt('Remove the serum from cart'),
    ).toBe(false);
  });

  it('detects explain_cancel_policy_for_client prompts (ai-cmd-provider-5.7.6)', () => {
    expect(
      isExplainCancelPolicyForClientPrompt(
        "What's our cancellation policy for this client?",
      ),
    ).toBe(true);
    expect(
      isExplainCancelPolicyForClientPrompt(
        'Explain the cancel policy for this booking',
      ),
    ).toBe(true);
    expect(
      isExplainCancelPolicyForClientPrompt(
        'Will she lose her deposit if she cancels?',
      ),
    ).toBe(true);
    expect(
      isExplainCancelPolicyForClientPrompt(
        'How much notice do we need to cancel this appointment?',
      ),
    ).toBe(true);
    expect(
      isExplainCancelPolicyForClientPrompt(
        'Is her deposit refundable if she cancels this booking?',
      ),
    ).toBe(true);
    expect(
      rescueProviderClientContextIntent(
        "What's our cancellation policy for this client?",
        'unknown',
      ),
    ).toEqual({
      action: 'explain_cancel_policy_for_client',
      rescueReason: 'explain_cancel_policy_for_client',
    });
  });

  it('does not let explain_cancel_policy_for_client steal deposit-balance or payment-breakdown reads', () => {
    expect(
      isExplainCancelPolicyForClientPrompt('How much is left at checkout?'),
    ).toBe(false);
    expect(
      isExplainCancelPolicyForClientPrompt(
        "What's the payment breakdown for this booking?",
      ),
    ).toBe(false);
    expect(
      isExplainCancelPolicyForClientPrompt('Cancel this booking'),
    ).toBe(false);
  });

  it('formats the cancel policy for client text', () => {
    expect(
      formatProviderCancelPolicyForClientText('Jane', [], [], null),
    ).toBe('No cancel/reschedule policy is configured for Jane\'s booking.');
    expect(
      formatProviderCancelPolicyForClientText(
        'Jane',
        ['Online cancellation is allowed.'],
        [],
        'Most services here do not require an online deposit.',
      ),
    ).toBe(
      "Jane's cancel/reschedule policy:\nOnline cancellation is allowed.\nMost services here do not require an online deposit.",
    );
  });

  it('does not steal dashboard bulk package-visit list/cancel commands', () => {
    expect(
      isExplainPackageVisitContextPrompt('list package visits this week'),
    ).toBe(false);
    expect(
      isExplainPackageVisitContextPrompt('cancel package visit for booking b1'),
    ).toBe(false);
  });

  it('formats package visit context and multi-service timeline text', () => {
    expect(formatProviderPackageVisitContextText('Jane', null)).toBe(
      "Jane's appointment isn't part of a package.",
    );
    expect(
      formatProviderPackageVisitContextText('Jane', {
        packagePurchaseId: 'pp-1',
        packageId: 'pkg-1',
        packageName: 'Facial Package',
        serviceIndex: 2,
        serviceTotal: 6,
        visitsRemaining: 4,
      }),
    ).toBe(
      'This is visit 2 of 6 in Facial Package — 4 visits remaining.',
    );

    expect(formatProviderMultiServiceTimelineText('Jane', null)).toBe(
      "Jane's appointment isn't part of a multi-service booking.",
    );
    expect(
      formatProviderMultiServiceTimelineText('Jane', {
        groupId: 'grp-1',
        schedulingMode: 'same_visit',
        serviceCount: 2,
        totalDurationMinutes: 90,
        totalPrice: 100,
        currency: 'USD',
        lines: [
          {
            bookingId: 'bk-1',
            serviceName: 'Blowdry',
            startTime: '2026-06-09T09:00:00.000Z',
            endTime: '2026-06-09T09:30:00.000Z',
            employeeName: 'Alex',
            status: 'confirmed',
            isCurrent: true,
          },
          {
            bookingId: 'bk-2',
            serviceName: 'Manicure',
            startTime: '2026-06-09T09:30:00.000Z',
            endTime: '2026-06-09T10:00:00.000Z',
            employeeName: 'Sam',
            status: 'confirmed',
            isCurrent: false,
          },
        ],
      }),
    ).toContain('Next up: Manicure with Sam.');

    const withGap = formatProviderMultiServiceTimelineText('Jane', {
      groupId: 'grp-2',
      schedulingMode: 'same_visit',
      serviceCount: 2,
      totalDurationMinutes: 60,
      totalPrice: 100,
      currency: 'USD',
      lines: [
        {
          bookingId: 'bk-3',
          serviceName: 'Blowdry',
          startTime: '2026-06-09T09:00:00.000Z',
          endTime: '2026-06-09T09:30:00.000Z',
          employeeName: 'Alex',
          status: 'confirmed',
          isCurrent: true,
        },
        {
          bookingId: 'bk-4',
          serviceName: 'Manicure',
          startTime: '2026-06-09T09:45:00.000Z',
          endTime: '2026-06-09T10:15:00.000Z',
          employeeName: 'Sam',
          status: 'confirmed',
          isCurrent: false,
        },
      ],
    });
    expect(withGap).toContain('1. Blowdry (current) — 09:00 with Alex (30m) (15m gap after)');
    expect(withGap).toContain('2. Manicure — 09:45 with Sam (30m)');
  });

  it('formats booking payment breakdown text (ai-cmd-provider-5.3.3)', () => {
    expect(
      formatProviderBookingPaymentBreakdownText('Jane', 'pending', null),
    ).toBe('No payment breakdown available for Jane\'s booking yet.');

    const summary = {
      currency: 'USD',
      servicePrice: 100,
      subtotal: 100,
      promoDiscount: 10,
      giftCardDiscount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsRedeemed: 0,
      promoCode: 'SAVE10',
      giftCardCode: null,
      cashPaid: 40,
      retailTotal: 20,
      retailLines: [],
      grandTotal: 110,
      totalDiscount: 10,
      hasDiscounts: true,
      adjustments: [],
    };
    const text = formatProviderBookingPaymentBreakdownText(
      'Jane',
      'partially_paid',
      summary,
    );
    expect(text).toContain('Service: USD 100.00');
    expect(text).toContain('Retail: USD 20.00');
    expect(text).toContain('Promo (SAVE10): -USD 10.00');
    expect(text).toContain('Total: USD 110.00');
    expect(text).toContain('Collected: USD 40.00');
    expect(text).toContain('USD 70.00 still owed (status: partially_paid).');

    expect(
      formatProviderBookingPaymentBreakdownText('Jane', 'paid', {
        ...summary,
        cashPaid: 110,
      }),
    ).toContain('Fully paid.');
  });

  it('formats deposit balance due text (ai-cmd-provider-5.3.5)', () => {
    expect(
      formatProviderDepositBalanceDueText('Jane', null),
    ).toBe("No payment details available for Jane's booking yet.");

    const summary = {
      currency: 'USD',
      servicePrice: 100,
      subtotal: 100,
      promoDiscount: 0,
      giftCardDiscount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsRedeemed: 0,
      promoCode: null,
      giftCardCode: null,
      cashPaid: 40,
      retailTotal: 0,
      retailLines: [],
      grandTotal: 100,
      totalDiscount: 0,
      hasDiscounts: false,
      adjustments: [],
    };
    expect(formatProviderDepositBalanceDueText('Jane', summary)).toBe(
      'Jane owes USD 60.00 of USD 100.00 (USD 40.00 already collected).',
    );

    expect(
      formatProviderDepositBalanceDueText('Jane', {
        ...summary,
        cashPaid: 100,
      }),
    ).toBe('Jane has no balance due — fully paid (USD 100.00).');
  });

  it('formats tour group text (ai-cmd-provider-5.18.4)', () => {
    expect(formatProviderTourGroupText('Jane', null)).toBe(
      "Jane's booking doesn't have a stored pax count (defaults to 1 traveler).",
    );
    expect(formatProviderTourGroupText('Jane', { paxCount: null })).toBe(
      "Jane's booking doesn't have a stored pax count (defaults to 1 traveler).",
    );
    expect(formatProviderTourGroupText('Jane', { paxCount: 1 })).toBe(
      "Jane's tour group: 1 traveler.",
    );
    expect(formatProviderTourGroupText('Jane', { paxCount: 6 })).toBe(
      "Jane's tour group: 6 travelers.",
    );
  });

  it('formats gift card redemption text (ai-cmd-provider-5.12.3)', () => {
    expect(formatProviderGiftCardRedemptionText('Jane', null, null, null)).toBe(
      "Jane's booking isn't using a gift card.",
    );

    const noGiftCardSummary = {
      currency: 'USD',
      servicePrice: 100,
      subtotal: 100,
      promoDiscount: 0,
      giftCardDiscount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsRedeemed: 0,
      promoCode: null,
      giftCardCode: null,
      cashPaid: 100,
      retailTotal: 0,
      retailLines: [],
      grandTotal: 100,
      totalDiscount: 0,
      hasDiscounts: false,
      adjustments: [],
    };
    expect(
      formatProviderGiftCardRedemptionText('Jane', noGiftCardSummary, null, null),
    ).toBe("Jane's booking isn't using a gift card.");

    const giftCardSummary = {
      ...noGiftCardSummary,
      giftCardDiscount: 30,
      giftCardCode: 'GC-ABC123',
      cashPaid: 70,
    };
    expect(
      formatProviderGiftCardRedemptionText('Jane', giftCardSummary, 45, 'USD'),
    ).toBe(
      'Gift card GC-ABC123 is covering USD 30.00 of this booking. The card covers part of the total — USD 70.00 still owed by another payment method. USD 45.00 remaining on the card.',
    );

    expect(
      formatProviderGiftCardRedemptionText('Jane', giftCardSummary, null, null),
    ).toBe(
      'Gift card GC-ABC123 is covering USD 30.00 of this booking. The card covers part of the total — USD 70.00 still owed by another payment method. Current card balance unavailable.',
    );

    const fullyCoveredSummary = {
      ...noGiftCardSummary,
      giftCardDiscount: 100,
      giftCardCode: 'GC-FULL99',
      cashPaid: 0,
    };
    expect(
      formatProviderGiftCardRedemptionText(
        'Jane',
        fullyCoveredSummary,
        20,
        'USD',
      ),
    ).toBe(
      'Gift card GC-FULL99 is covering USD 100.00 of this booking. The card covers the full booking total — nothing else owed. USD 20.00 remaining on the card.',
    );
  });

  it('formats retail cart text (ai-cmd-provider-5.4.3)', () => {
    expect(formatProviderRetailCartText('Jane', null)).toBe(
      'No retail products on Jane\'s booking yet.',
    );

    const emptySummary = {
      currency: 'USD',
      servicePrice: 100,
      subtotal: 100,
      promoDiscount: 0,
      giftCardDiscount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsRedeemed: 0,
      promoCode: null,
      giftCardCode: null,
      cashPaid: 0,
      retailTotal: 0,
      retailLines: [],
      grandTotal: 100,
      totalDiscount: 0,
      hasDiscounts: false,
      adjustments: [],
    };
    expect(formatProviderRetailCartText('Jane', emptySummary)).toBe(
      'No retail products on Jane\'s booking yet.',
    );

    const text = formatProviderRetailCartText('Jane', {
      ...emptySummary,
      retailTotal: 45,
      retailLines: [
        { productName: 'Olaplex 3', quantity: 1, unitPrice: 30, lineTotal: 30 },
        { productName: 'Shampoo', quantity: 1, unitPrice: 15, lineTotal: 15 },
      ],
    });
    expect(text).toContain('1x Olaplex 3 — USD 30.00');
    expect(text).toContain('1x Shampoo — USD 15.00');
    expect(text).toContain('Retail total: USD 45.00.');
  });

  it('formats staff notes list and intake summary text', () => {
    expect(
      formatProviderClientStaffNotesText('Jane', {
        notes: [],
        canCreate: true,
        maxLength: 500,
      }),
    ).toContain('No staff notes on file');

    expect(
      formatProviderClientStaffNotesText('Jane', {
        notes: [
          {
            id: 'n1',
            body: 'Prefers quiet chair',
            authorEmployeeId: 'e1',
            authorName: 'Alex',
            bookingId: 'bk-1',
            createdAt: '2026-05-01T11:00:00.000Z',
          },
        ],
        canCreate: true,
        maxLength: 500,
      }),
    ).toContain('Prefers quiet chair');

    expect(
      formatProviderClientIntakeText({
        visible: false,
        intakeId: null,
        questionnaireTitle: null,
        status: 'none',
        completedAt: null,
        answers: [],
        totalAnswerCount: 0,
        bookingId: 'bk-1',
        canOpenDashboard: false,
      } as any),
    ).toContain('No pre-visit intake applies');

    expect(
      formatProviderClientIntakeText({
        visible: true,
        intakeId: 'i1',
        questionnaireTitle: 'New Client Intake',
        status: 'completed',
        completedAt: '2026-05-01T11:00:00.000Z',
        answers: [
          { questionId: 'q1', questionText: 'Allergies?', answerText: 'Latex' },
        ],
        totalAnswerCount: 1,
        bookingId: 'bk-1',
        canOpenDashboard: false,
      } as any),
    ).toContain('Allergies?: Latex');
  });

  it('does not treat dashboard booking overview as summarize_client', () => {
    expect(isSummarizeClientPrompt('Booking overview for today')).toBe(false);
    expect(
      rescueProviderClientContextIntent(
        'Booking overview for today',
        'unknown',
      ),
    ).toBeNull();
  });

  it('extracts note body and customer name from natural language', () => {
    expect(
      extractClientNoteBodyFromPrompt('Add staff note: allergic to latex'),
    ).toBe('allergic to latex');
    expect(
      extractClientNoteBodyFromPrompt(
        'Add a note for this client — wants extra toner',
      ),
    ).toBe('wants extra toner');
    expect(extractClientNoteBodyFromPrompt('Add a note for this client')).toBe(
      null,
    );
    expect(extractCustomerNameFromClientPrompt('Summarize Jane Doe')).toBe(
      'Jane Doe',
    );
  });

  it('formats client summary and visit history text', () => {
    const summary = formatProviderClientSummaryText({
      customerId: 'cust-1',
      name: 'Jane Doe',
      phone: null,
      email: null,
      loyaltyPointsBalance: 40,
      loyaltyPointsValue: 4,
      completedVisitCount: 3,
      lastCompletedVisitAt: '2026-05-01T11:00:00.000Z',
      noShowCount: 1,
      marketingOptIn: true,
      referral: null,
      badges: [],
      loyaltyQuickView: {
        pointsBalance: 40,
        pointsValue: 4,
        lifetimeEarned: 40,
        lastEarn: null,
        lastRedeem: null,
        staffCanAdjust: false,
      },
      recentCompletedVisits: [
        {
          bookingId: 'bk-1',
          serviceName: 'Color',
          providerName: 'Sam',
          completedAt: '2026-05-01T11:00:00.000Z',
        },
      ],
    });

    expect(summary).toContain('Jane Doe');
    expect(summary).toContain('40 loyalty pts');
    expect(summary).toContain('Color');

    const winBackSummary = formatProviderClientSummaryText({
      customerId: 'cust-2',
      name: 'Lapsed Client',
      phone: null,
      email: null,
      loyaltyPointsBalance: 0,
      loyaltyPointsValue: 0,
      completedVisitCount: 2,
      lastCompletedVisitAt: '2025-12-01T10:00:00.000Z',
      noShowCount: 0,
      marketingOptIn: false,
      referral: null,
      badges: [{ id: 'win_back', tone: 'tertiary' }],
      loyaltyQuickView: {
        pointsBalance: 0,
        pointsValue: 0,
        lifetimeEarned: 15,
        lastEarn: {
          points: 5,
          occurredAt: '2025-11-01T10:00:00.000Z',
          note: 'Earned from paid booking',
        },
        lastRedeem: null,
        staffCanAdjust: false,
      },
      recentCompletedVisits: [],
    });
    expect(winBackSummary).toContain('Win-back');
    expect(winBackSummary).toContain('last earn +5');

    const history = formatProviderClientHistoryText('Jane Doe', [
      {
        bookingId: 'bk-1',
        serviceName: 'Trim',
        providerName: 'Alex',
        completedAt: '2026-04-01T10:00:00.000Z',
      },
    ]);
    expect(history).toContain('Trim with Alex');
  });

  it('resolves note body from params before prompt', () => {
    expect(resolveClientNoteBody({ clientNote: 'VIP client' }, 'ignored')).toBe(
      'VIP client',
    );
  });

  it('rescues misclassified list_bookings to show_client_history', () => {
    expect(
      rescueProviderClientContextIntent('Past visits for Jane', 'list_bookings')
        ?.action,
    ).toBe('show_client_history');
  });
});
