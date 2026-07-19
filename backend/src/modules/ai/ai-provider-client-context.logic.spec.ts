import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  dispatchProviderClientContextIntent,
  handleAddClientNoteLogic,
  handleExplainBookingPaymentBreakdownLogic,
  handleExplainCancelPolicyForClientLogic,
  handleExplainDepositBalanceDueLogic,
  handleExplainGiftCardRedemptionLogic,
  handleExplainTourGroupOnBookingLogic,
  handleExplainRetailCartLogic,
  handleExplainClientIntakeLogic,
  handleExplainMultiServiceTimelineLogic,
  handleExplainPackageVisitContextLogic,
  handleListClientStaffNotesLogic,
  handleShowClientHistoryLogic,
  handleSummarizeClientLogic,
} from './ai-provider-client-context.logic.js';

describe('ai-provider-client-context.logic (prov-exp-1.6)', () => {
  const bookingRepo = { find: jest.fn(), findOne: jest.fn() };
  const giftCardRepo = { findOne: jest.fn() };
  const providerMobile = {
    resolveMobileAccess: jest.fn(),
    getScopedEmployeeId: jest.fn(),
    getBookingDetail: jest.fn(),
    getBookingCustomerContext: jest.fn(),
    createBookingCustomerStaffNote: jest.fn(),
    listBookingCustomerStaffNotes: jest.fn(),
    getBookingPreVisitIntakeSummary: jest.fn(),
    explainCancelPolicyForBooking: jest.fn(),
  };

  const deps = {
    bookingRepo: bookingRepo as any,
    providerMobile: providerMobile as any,
    giftCardRepo: giftCardRepo as any,
  };

  const contextView = {
    customerId: 'cust-1',
    name: 'Jane Doe',
    phone: null,
    email: null,
    loyaltyPointsBalance: 20,
    loyaltyPointsValue: 2,
    completedVisitCount: 2,
    lastCompletedVisitAt: '2026-05-01T11:00:00.000Z',
    noShowCount: 0,
    marketingOptIn: true,
    referral: null,
    recentCompletedVisits: [
      {
        bookingId: 'bk-old',
        serviceName: 'Color',
        providerName: 'Sam',
        completedAt: '2026-05-01T11:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'provider',
      employee: { id: 'emp-1' },
    });
    providerMobile.getScopedEmployeeId.mockReturnValue('emp-1');
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      checkoutContext: { package: null, subscription: null, multiService: null },
    });
    providerMobile.getBookingCustomerContext.mockResolvedValue(contextView);
    providerMobile.createBookingCustomerStaffNote.mockResolvedValue({
      note: { id: 'note-1', body: 'Allergic to latex' },
      maxLength: 500,
    });
    providerMobile.listBookingCustomerStaffNotes.mockResolvedValue({
      notes: [
        {
          id: 'note-1',
          body: 'Allergic to latex',
          authorEmployeeId: 'emp-1',
          authorName: 'Alex',
          bookingId: 'bk-1',
          createdAt: '2026-05-01T11:00:00.000Z',
        },
      ],
      canCreate: true,
      maxLength: 500,
    });
    providerMobile.getBookingPreVisitIntakeSummary.mockResolvedValue({
      visible: true,
      intakeId: 'intake-1',
      questionnaireTitle: 'New Client Intake',
      status: 'completed',
      completedAt: '2026-05-01T11:00:00.000Z',
      answers: [
        {
          questionId: 'q1',
          questionText: 'Any allergies?',
          answerText: 'Latex',
        },
      ],
      totalAnswerCount: 1,
      bookingId: 'bk-1',
      canOpenDashboard: false,
    });
  });

  it('summarizes client when bookingId is in session context', async () => {
    const result = await handleSummarizeClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Summarize this client',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('summarize_client');
    expect(result.summary).toContain('Jane Doe');
    expect(providerMobile.getBookingCustomerContext).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
    );
  });

  it('shows visit history for named client via booking lookup', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-1',
        customer: { name: 'Jane Doe' },
        status: BookingStatus.CONFIRMED,
      },
    ]);

    const result = await handleShowClientHistoryLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Jane' },
      "Show Jane's visit history",
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('show_client_history');
    expect(result.summary).toContain('Color with Sam');
  });

  it('creates staff note on booking customer', async () => {
    const result = await handleAddClientNoteLogic(
      deps,
      'biz-1',
      'user-1',
      { clientNote: 'Allergic to latex' },
      'Add staff note: allergic to latex',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('add_client_note');
    expect(providerMobile.createBookingCustomerStaffNote).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
      { body: 'Allergic to latex' },
    );
  });

  it('clarifies when note body is missing', async () => {
    const result = await handleAddClientNoteLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Add a note for this client',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when booking id is invalid', async () => {
    providerMobile.getBookingDetail.mockRejectedValue(new Error('not found'));

    const result = await handleSummarizeClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Summarize this client',
      { bookingId: 'missing' },
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when customer name cannot be resolved', async () => {
    const result = await handleShowClientHistoryLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Show visit history',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['bookingId', 'customerName']);
  });

  it('clarifies when no upcoming booking matches customer name', async () => {
    bookingRepo.find.mockResolvedValue([]);

    const result = await handleSummarizeClientLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Jane' },
      'Summarize Jane',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No upcoming appointment');
  });

  it('lists staff notes for booking customer', async () => {
    const result = await handleListClientStaffNotesLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Show staff notes for this client',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('list_client_staff_notes');
    expect(result.summary).toContain('Allergic to latex');
    expect(providerMobile.listBookingCustomerStaffNotes).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
    );
  });

  it('reports no staff notes on file yet', async () => {
    providerMobile.listBookingCustomerStaffNotes.mockResolvedValue({
      notes: [],
      canCreate: true,
      maxLength: 500,
    });

    const result = await handleListClientStaffNotesLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Any notes on this client?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No staff notes on file');
  });

  it('clarifies list_client_staff_notes when booking cannot be resolved', async () => {
    const result = await handleListClientStaffNotesLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Show staff notes',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['bookingId', 'customerName']);
  });

  it('explains client intake summary for booking', async () => {
    const result = await handleExplainClientIntakeLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What does their pre-visit intake say?",
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_client_intake');
    expect(result.summary).toContain('New Client Intake');
    expect(result.summary).toContain('Latex');
    expect(
      providerMobile.getBookingPreVisitIntakeSummary,
    ).toHaveBeenCalledWith('biz-1', 'user-1', 'bk-1');
  });

  it('reports no intake submitted yet', async () => {
    providerMobile.getBookingPreVisitIntakeSummary.mockResolvedValue({
      visible: true,
      intakeId: null,
      questionnaireTitle: null,
      status: 'none',
      completedAt: null,
      answers: [],
      totalAnswerCount: 0,
      bookingId: 'bk-1',
      canOpenDashboard: false,
    });

    const result = await handleExplainClientIntakeLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Did they fill out the intake questionnaire?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No pre-visit intake has been submitted');
  });

  it('reports intake not applicable to this booking', async () => {
    providerMobile.getBookingPreVisitIntakeSummary.mockResolvedValue({
      visible: false,
      intakeId: null,
      questionnaireTitle: null,
      status: 'none',
      completedAt: null,
      answers: [],
      totalAnswerCount: 0,
      bookingId: 'bk-1',
      canOpenDashboard: false,
    });

    const result = await handleExplainClientIntakeLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'What does their intake say?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No pre-visit intake applies');
  });

  it('clarifies explain_client_intake when booking cannot be resolved', async () => {
    const result = await handleExplainClientIntakeLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'What does their intake say?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['bookingId', 'customerName']);
  });

  it('explains package visit context for a package booking (ai-cmd-provider-5.2.8)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      checkoutContext: {
        package: {
          packagePurchaseId: 'pp-1',
          packageId: 'pkg-1',
          packageName: 'Facial Package',
          serviceIndex: 2,
          serviceTotal: 6,
          visitsRemaining: 4,
        },
        subscription: null,
        multiService: null,
      },
    });

    const result = await handleExplainPackageVisitContextLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Which visit is this in her package?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_package_visit_context');
    expect(result.summary).toBe(
      'This is visit 2 of 6 in Facial Package — 4 visits remaining.',
    );
    expect(result.details?.package).toMatchObject({ serviceIndex: 2 });
  });

  it('reports no package context when the booking is not part of a package', async () => {
    const result = await handleExplainPackageVisitContextLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Which visit is this in her package?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain("isn't part of a package");
  });

  it('explains the multi-service timeline for a multi-service booking (ai-cmd-provider-5.2.9)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      checkoutContext: {
        package: null,
        subscription: null,
        multiService: {
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
        },
      },
    });

    const result = await handleExplainMultiServiceTimelineLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What's next after this blowdry?",
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_multi_service_timeline');
    expect(result.summary).toContain('Next up: Manicure with Sam.');
    expect(result.details?.multiService).toMatchObject({ serviceCount: 2 });
  });

  it('reports no multi-service context when the booking is standalone', async () => {
    const result = await handleExplainMultiServiceTimelineLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What's next after this blowdry?",
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain("isn't part of a multi-service booking");
  });

  it('explains booking payment breakdown for a booking (ai-cmd-provider-5.3.3)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      paymentStatus: 'partially_paid',
      checkoutContext: { package: null, subscription: null, multiService: null },
      paymentSummary: {
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
      },
    });

    const result = await handleExplainBookingPaymentBreakdownLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What's the payment breakdown for this booking?",
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_booking_payment_breakdown');
    expect(result.summary).toContain('USD 60.00 still owed');
    expect(result.details?.paymentSummary).toMatchObject({ grandTotal: 100 });
  });

  it('reports no payment breakdown when the booking has no pricing metadata', async () => {
    const result = await handleExplainBookingPaymentBreakdownLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What's the payment breakdown for this booking?",
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No payment breakdown available');
  });

  it('explains deposit balance due for a booking (ai-cmd-provider-5.3.5)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      paymentStatus: 'partially_paid',
      checkoutContext: { package: null, subscription: null, multiService: null },
      paymentSummary: {
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
      },
    });

    const result = await handleExplainDepositBalanceDueLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'How much is left at checkout?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_deposit_balance_due');
    expect(result.summary).toBe(
      'Jane Doe owes USD 60.00 of USD 100.00 (USD 40.00 already collected).',
    );
    expect(result.details?.paymentSummary).toMatchObject({ grandTotal: 100 });
  });

  it('reports no payment details when explaining deposit balance due without pricing metadata', async () => {
    const result = await handleExplainDepositBalanceDueLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'How much is left at checkout?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No payment details available');
  });

  it('explains retail cart for a booking (ai-cmd-provider-5.4.3)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      checkoutContext: { package: null, subscription: null, multiService: null },
      paymentSummary: {
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
        retailTotal: 30,
        retailLines: [
          { productName: 'Olaplex 3', quantity: 1, unitPrice: 30, lineTotal: 30 },
        ],
        grandTotal: 130,
        totalDiscount: 0,
        hasDiscounts: false,
        adjustments: [],
      },
    });

    const result = await handleExplainRetailCartLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What's on the retail tab?",
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_retail_cart');
    expect(result.summary).toContain('1x Olaplex 3 — USD 30.00');
    expect(result.details?.paymentSummary).toMatchObject({ retailTotal: 30 });
  });

  it('reports no retail products when explaining retail cart with an empty cart', async () => {
    const result = await handleExplainRetailCartLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What's on the retail tab?",
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No retail products');
  });

  it('explains the cancel policy for a client booking', async () => {
    providerMobile.explainCancelPolicyForBooking.mockResolvedValue({
      customerName: 'Jane Doe',
      settingsLines: ['Online cancellation is allowed.'],
      depositLines: [],
      generalDepositLine:
        'Most services here do not require an online deposit.',
      depositContext: { prepaymentMode: 'none' },
      bookingPolicy: {
        cancel: { allowed: true },
        reschedule: { allowed: true },
        deposit: { prepaymentMode: 'none' },
      },
    });

    const result = await handleExplainCancelPolicyForClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "What's our cancellation policy for this client?",
      { bookingId: 'bk-1' },
    );

    expect(providerMobile.explainCancelPolicyForBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_cancel_policy_for_client');
    expect(result.summary).toContain('Online cancellation is allowed.');
    expect(result.details?.bookingPolicy).toMatchObject({
      cancel: { allowed: true },
    });
  });

  it('explains gift card redemption for a booking using a gift card (ai-cmd-provider-5.12.3)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      paymentStatus: 'paid',
      checkoutContext: { package: null, subscription: null, multiService: null },
      paymentSummary: {
        currency: 'USD',
        servicePrice: 100,
        subtotal: 100,
        promoDiscount: 0,
        giftCardDiscount: 30,
        loyaltyDiscount: 0,
        loyaltyPointsRedeemed: 0,
        promoCode: null,
        giftCardCode: 'GC-ABC123',
        cashPaid: 70,
        retailTotal: 0,
        retailLines: [],
        grandTotal: 100,
        totalDiscount: 30,
        hasDiscounts: true,
        adjustments: [],
      },
    });
    giftCardRepo.findOne.mockResolvedValue({
      code: 'GC-ABC123',
      balance: 45,
      currency: 'USD',
    });

    const result = await handleExplainGiftCardRedemptionLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "She's paying with gift card — balance?",
      { bookingId: 'bk-1' },
    );

    expect(giftCardRepo.findOne).toHaveBeenCalledWith({
      where: { businessId: 'biz-1', code: 'GC-ABC123' },
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_gift_card_redemption');
    expect(result.summary).toBe(
      'Gift card GC-ABC123 is covering USD 30.00 of this booking. The card covers part of the total — USD 70.00 still owed by another payment method. USD 45.00 remaining on the card.',
    );
    expect(result.details?.cardBalance).toBe(45);
  });

  it('reports no gift card when the booking is not using one', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
      paymentStatus: 'paid',
      checkoutContext: { package: null, subscription: null, multiService: null },
      paymentSummary: {
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
      },
    });

    const result = await handleExplainGiftCardRedemptionLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      "She's paying with gift card — balance?",
      { bookingId: 'bk-1' },
    );

    expect(giftCardRepo.findOne).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.summary).toBe("Jane Doe's booking isn't using a gift card.");
  });

  it('explains tour group pax count on a booking (ai-cmd-provider-5.18.4)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
    });
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      metadata: { paxCount: 6 },
    });

    const result = await handleExplainTourGroupOnBookingLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'How many pax on this tour?',
      { bookingId: 'bk-1' },
    );

    expect(bookingRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'bk-1', businessId: 'biz-1' },
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tour_group_on_booking');
    expect(result.summary).toBe("Jane Doe's tour group: 6 travelers.");
    expect(result.details?.paxCount).toBe(6);
  });

  it('reports no stored pax count when the booking has none', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
    });
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      metadata: {},
    });

    const result = await handleExplainTourGroupOnBookingLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'How many pax on this tour?',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toBe(
      "Jane Doe's booking doesn't have a stored pax count (defaults to 1 traveler).",
    );
    expect(result.details?.paxCount).toBeNull();
  });

  it('dispatches provider client context intents', async () => {
    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'summarize_client',
        {},
        'Summarize this client',
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({ success: true, action: 'summarize_client' });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'list_client_staff_notes',
        {},
        'Show staff notes',
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'list_client_staff_notes',
    });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'explain_client_intake',
        {},
        'What does their intake say?',
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'explain_client_intake',
    });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'explain_package_visit_context',
        {},
        'Which visit is this in her package?',
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'explain_package_visit_context',
    });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'explain_multi_service_timeline',
        {},
        "What's next after this blowdry?",
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'explain_multi_service_timeline',
    });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'explain_booking_payment_breakdown',
        {},
        "What's the payment breakdown for this booking?",
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'explain_booking_payment_breakdown',
    });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'explain_deposit_balance_due',
        {},
        'How much is left at checkout?',
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'explain_deposit_balance_due',
    });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'explain_retail_cart',
        {},
        "What's on the retail tab?",
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'explain_retail_cart',
    });

    await expect(
      dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'explain_gift_card_redemption',
        {},
        "She's paying with gift card — balance?",
        { bookingId: 'bk-1' },
      ),
    ).resolves.toMatchObject({
      success: true,
      action: 'explain_gift_card_redemption',
    });

    expect(
      await dispatchProviderClientContextIntent(
        deps,
        'biz-1',
        'user-1',
        'unknown_action',
        {},
      ),
    ).toBeNull();
  });
});
