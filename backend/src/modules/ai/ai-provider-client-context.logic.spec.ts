import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  dispatchProviderClientContextIntent,
  handleAddClientNoteLogic,
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
