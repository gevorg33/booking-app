import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  dispatchProviderClientContextIntent,
  handleAddClientNoteLogic,
  handleExplainClientIntakeLogic,
  handleListClientStaffNotesLogic,
  handleShowClientHistoryLogic,
  handleSummarizeClientLogic,
} from './ai-provider-client-context.logic.js';

describe('ai-provider-client-context.logic (prov-exp-1.6)', () => {
  const bookingRepo = { find: jest.fn() };
  const providerMobile = {
    resolveMobileAccess: jest.fn(),
    getScopedEmployeeId: jest.fn(),
    getBookingDetail: jest.fn(),
    getBookingCustomerContext: jest.fn(),
    createBookingCustomerStaffNote: jest.fn(),
    listBookingCustomerStaffNotes: jest.fn(),
    getBookingPreVisitIntakeSummary: jest.fn(),
  };

  const deps = {
    bookingRepo: bookingRepo as any,
    providerMobile: providerMobile as any,
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
