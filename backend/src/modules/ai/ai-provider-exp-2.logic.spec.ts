import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  dispatchProviderExp2Intent,
  handleCheckInClientLogic,
  handleDraftReviewResponseLogic,
  handleExplainRequestReviewFlowLogic,
  handleExplainReviewsInboxLogic,
  handleListReassignOptionsLogic,
  handleListTeamUnpaidTodayLogic,
  handleMarkReadyNowLogic,
  handleMarkRunningLateLogic,
  handleMyStatsLogic,
  handleOpenDashboardDeepLinkLogic,
  handleReassignBookingSameDayLogic,
  handleRequestClientReviewLogic,
  handleSuggestCancelNoteLogic,
  handleTeamFloorStatusLogic,
} from './ai-provider-exp-2.logic.js';

describe('ai-provider-exp-2.logic', () => {
  const bookingRepo = { find: jest.fn() };
  const businessService = { findOne: jest.fn() };
  const providerMobile = {
    resolveMobileAccess: jest.fn(),
    getScopedEmployeeId: jest.fn(),
    getMyStats: jest.fn(),
    getTeamFloorToday: jest.fn(),
    getBookingDetail: jest.fn(),
    checkInBooking: jest.fn(),
    markBookingRunningLate: jest.fn(),
    markBookingReadyNow: jest.fn(),
    suggestCancelNote: jest.fn(),
    requestBookingReview: jest.fn(),
    getBookingReassignOptions: jest.fn(),
    reassignBooking: jest.fn(),
    getTeamUnpaidToday: jest.fn(),
  };
  const reviewsService = {
    list: jest.fn(),
  };

  const configService = { get: jest.fn() };

  const deps = {
    bookingRepo: bookingRepo as any,
    businessService: businessService as any,
    providerMobile: providerMobile as any,
    reviewsService: reviewsService as any,
    configService: configService as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'provider',
      employee: { id: 'emp-1', name: 'Alex' },
    });
    providerMobile.getScopedEmployeeId.mockReturnValue('emp-1');
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD' },
    });
  });

  it('returns my stats summary', async () => {
    providerMobile.getMyStats.mockResolvedValue({
      period: 'week',
      scope: 'mine',
      completedBookings: 8,
      paidRevenue: 320,
      currency: 'USD',
      utilizationPercent: 65,
      bookedMinutes: 300,
      scheduledMinutes: 460,
      averageReviewScore: null,
      newReviewsCount: 0,
      tipsEnabled: false,
    });

    const result = await handleMyStatsLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Show my stats this week',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('my_stats');
    expect(result.summary).toContain('8 completed visits');
    expect(providerMobile.getMyStats).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      expect.objectContaining({ period: 'week', scope: 'mine' }),
    );
  });

  it('denies team floor status for non-managers', async () => {
    const result = await handleTeamFloorStatusLogic(deps, 'biz-1', 'user-1');

    expect(result.success).toBe(false);
    expect(result.summary).toContain('managers only');
  });

  it('returns team floor summary for managers', async () => {
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'team',
      employee: { id: 'emp-1', name: 'Alex' },
    });
    providerMobile.getTeamFloorToday.mockResolvedValue({
      date: '2026-06-09',
      totalBookings: 1,
      columns: [
        {
          employeeId: 'emp-1',
          employeeName: 'Alex',
          statusCounts: {
            waiting: 1,
            in_service: 0,
            done: 0,
            no_show: 0,
          },
          bookings: [],
        },
      ],
    });

    const result = await handleTeamFloorStatusLogic(deps, 'biz-1', 'user-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('team_floor_status');
    expect(result.summary).toContain('Team floor today');
  });

  it('denies list_team_unpaid_today for non-managers', async () => {
    const result = await handleListTeamUnpaidTodayLogic(deps, 'biz-1', 'user-1');

    expect(result.success).toBe(false);
    expect(result.summary).toContain('managers only');
  });

  it('returns unpaid-today summary for managers', async () => {
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'team',
      employee: { id: 'emp-1', name: 'Alex' },
    });
    providerMobile.getTeamUnpaidToday.mockResolvedValue({
      date: '2026-07-10',
      totalUnpaid: 1,
      bookings: [
        {
          id: 'bk-1',
          customerName: 'Jane Doe',
          employeeName: 'Sam',
          serviceName: 'Haircut',
          startTime: new Date('2026-07-10T14:00:00.000Z'),
          servicePrice: 45,
        },
      ],
    });

    const result = await handleListTeamUnpaidTodayLogic(deps, 'biz-1', 'user-1');

    expect(result.success).toBe(true);
    expect(result.action).toBe('list_team_unpaid_today');
    expect(result.summary).toContain('1 unpaid appointment today');
    expect(providerMobile.getTeamUnpaidToday).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
  });

  it('returns own reviews inbox summary for a provider', async () => {
    reviewsService.list.mockResolvedValue([
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Great service!',
        customerName: 'Jane Doe',
        employee: { name: 'Alex' },
        createdAt: new Date(),
      },
      {
        id: 'rev-2',
        rating: 2,
        comment: 'Not happy',
        customerName: 'John Roe',
        employee: { name: 'Alex' },
        createdAt: new Date(),
      },
    ]);

    const result = await handleExplainReviewsInboxLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'My rating this month',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_reviews_inbox');
    expect(result.summary).toContain('Your reviews this month: 2 reviews');
    expect(result.summary).toContain('(low)');
    expect(reviewsService.list).toHaveBeenCalledWith('biz-1', 'emp-1');
    expect(result.details?.scope).toBe('mine');
  });

  it('returns team-wide reviews inbox for managers', async () => {
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'team',
      employee: { id: 'emp-1', name: 'Alex' },
    });
    reviewsService.list.mockResolvedValue([]);

    const result = await handleExplainReviewsInboxLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Team reviews this month',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Team reviews this month: no reviews yet.');
    expect(reviewsService.list).toHaveBeenCalledWith('biz-1', undefined);
    expect(result.details?.scope).toBe('team');
  });

  it('filters reviews inbox to the requested period', async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const lastMonth = new Date();
    lastMonth.setUTCDate(lastMonth.getUTCDate() - 45);
    reviewsService.list.mockResolvedValue([
      {
        id: 'rev-old',
        rating: 5,
        comment: null,
        customerName: 'Old Customer',
        employee: { name: 'Alex' },
        createdAt: lastMonth,
      },
      {
        id: 'rev-yesterday',
        rating: 1,
        comment: 'Bad',
        customerName: 'Angry Customer',
        employee: { name: 'Alex' },
        createdAt: yesterday,
      },
    ]);

    const result = await handleExplainReviewsInboxLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Bad review yesterday — show it',
    );

    expect(result.details?.reviewCount).toBe(1);
    expect(result.summary).toContain('Angry Customer');
    expect(result.summary).not.toContain('Old Customer');
  });

  it('filters the reviews inbox to a specific star rating', async () => {
    reviewsService.list.mockResolvedValue([
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Amazing!',
        customerName: 'Jane Doe',
        employee: { name: 'Alex' },
        createdAt: new Date(),
      },
      {
        id: 'rev-2',
        rating: 2,
        comment: 'Not happy',
        customerName: 'John Roe',
        employee: { name: 'Alex' },
        createdAt: new Date(),
      },
    ]);

    const result = await handleExplainReviewsInboxLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Latest 5-star reviews',
    );

    expect(result.details?.reviewCount).toBe(1);
    expect(result.summary).toContain('Jane Doe');
    expect(result.summary).not.toContain('John Roe');
    expect(result.summary).toContain('5★ reviews');
  });

  it('returns the explain_request_review_flow policy text', async () => {
    const result = await handleExplainRequestReviewFlowLogic();

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_request_review_flow');
    expect(result.summary).toContain('Request review');
  });

  it('drafts a review response for the most recent review', async () => {
    reviewsService.list.mockResolvedValue([
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Amazing!',
        customerName: 'Jane Doe',
        employee: { name: 'Alex' },
        createdAt: new Date(),
      },
    ]);

    const result = await handleDraftReviewResponseLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Draft professional response',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('draft_review_response');
    expect(result.details?.reviewId).toBe('rev-1');
    expect(result.summary).toContain('Jane Doe');
    expect(result.summary).toContain('thank you');
  });

  it('drafts a review response for a named customer', async () => {
    reviewsService.list.mockResolvedValue([
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Amazing!',
        customerName: 'Jane Doe',
        employee: { name: 'Alex' },
        createdAt: new Date(),
      },
      {
        id: 'rev-2',
        rating: 1,
        comment: 'Terrible',
        customerName: 'John Roe',
        employee: { name: 'Alex' },
        createdAt: new Date(),
      },
    ]);

    const result = await handleDraftReviewResponseLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'John Roe' },
      'Help reply to this review',
    );

    expect(result.success).toBe(true);
    expect(result.details?.reviewId).toBe('rev-2');
    expect(result.summary).toContain('sorry');
  });

  it('fails to draft a review response when there are no reviews yet', async () => {
    reviewsService.list.mockResolvedValue([]);

    const result = await handleDraftReviewResponseLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Draft professional response',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('draft_review_response');
  });

  it('builds a dashboard deep link for a named customer', () => {
    configService.get.mockReturnValue('https://app.example.com');

    const result = handleOpenDashboardDeepLinkLogic(
      deps,
      {},
      'Open CRM for Jane',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('open_dashboard_deep_link');
    expect(result.details?.url).toBe(
      'https://app.example.com/dashboard/customers?search=Jane',
    );
  });

  it('falls back to localhost when FRONTEND_URL is unset', () => {
    configService.get.mockReturnValue(undefined);

    const result = handleOpenDashboardDeepLinkLogic(
      deps,
      {},
      'Open CRM for Jane',
    );

    expect(result.details?.url).toBe(
      'http://localhost:3000/dashboard/customers?search=Jane',
    );
  });

  it('fails to build a dashboard deep link with no customer name', () => {
    const result = handleOpenDashboardDeepLinkLogic(deps, {}, 'Full intake on web');

    expect(result.success).toBe(false);
    expect(result.action).toBe('open_dashboard_deep_link');
  });

  it('checks in client by bookingId from session context', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-1',
      customer: { name: 'Jane Doe' },
    });
    providerMobile.checkInBooking.mockResolvedValue({
      checkedInAt: '2026-06-09T14:00:00.000Z',
      floorStatus: 'waiting',
    });

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Check in Jane Doe',
      { bookingId: 'bk-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('check_in_client');
    expect(result.summary).toContain('Checked in Jane Doe');
    expect(providerMobile.checkInBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
    );
  });

  it('resolves booking by customer name for check-in', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-2',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-09T15:00:00.000Z'),
        customer: { name: 'Sam Lee' },
      },
    ]);
    providerMobile.checkInBooking.mockResolvedValue({
      checkedInAt: '2026-06-09T14:55:00.000Z',
      floorStatus: 'waiting',
    });

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Sam' },
      'Check in Sam',
    );

    expect(result.success).toBe(true);
    expect(providerMobile.checkInBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-2',
    );
  });

  it('clarifies when booking target is missing for check-in', async () => {
    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Check in now',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('clarifies when booking target is missing for running late', async () => {
    const result = await handleMarkRunningLateLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Running late',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('resolves bookingId from session context', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-context',
      customer: { name: 'Jane' },
    });
    providerMobile.checkInBooking.mockResolvedValue({
      checkedInAt: '2026-06-09T10:00:00.000Z',
      floorStatus: 'waiting',
    });

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Check in',
      { bookingId: 'bk-context' },
    );

    expect(result.success).toBe(true);
    expect(providerMobile.checkInBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-context',
    );
  });

  it('uses default late minutes when service omits visit status', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-6',
      customer: { name: 'Jane' },
    });
    providerMobile.markBookingRunningLate.mockResolvedValue({
      visitStatus: null,
      floorStatus: 'waiting',
      notifications: { sent: false },
    });

    const result = await handleMarkRunningLateLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Running late for Jane',
      { bookingId: 'bk-6' },
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('running 10 minutes late');
  });

  it('queries team bookings when provider has no scoped employee', async () => {
    providerMobile.getScopedEmployeeId.mockReturnValue(null);
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'team',
      employee: null,
    });
    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-team',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-09T11:00:00.000Z'),
        customer: { name: 'Sam Lee' },
      },
    ]);
    providerMobile.checkInBooking.mockResolvedValue({
      checkedInAt: '2026-06-09T10:55:00.000Z',
      floorStatus: 'waiting',
    });

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Sam' },
      'Check in Sam',
    );

    expect(result.success).toBe(true);
    expect(bookingRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ employeeId: expect.anything() }),
      }),
    );
  });

  it('marks client running late with minutes', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-3',
      customer: { name: 'Maria' },
    });
    providerMobile.markBookingRunningLate.mockResolvedValue({
      visitStatus: { minutesLate: 10 },
      floorStatus: 'waiting',
      notifications: { sent: true },
    });

    const result = await handleMarkRunningLateLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Maria', minutesLate: 10 },
      "I'm running 10 minutes late for Maria",
      { bookingId: 'bk-3' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('mark_running_late');
    expect(result.summary).toContain('running 10 minutes late');
    expect(providerMobile.markBookingRunningLate).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-3',
      10,
    );
  });

  it('returns clarify when explicit bookingId is not accessible', async () => {
    providerMobile.getBookingDetail.mockRejectedValue(new Error('not found'));

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'missing' },
      'Check in Jane',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns clarify when no booking matches customer name', async () => {
    bookingRepo.find.mockResolvedValue([]);

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Nobody' },
      'Check in Nobody',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No active appointment');
  });

  it('surfaces check-in errors from provider mobile', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-4',
      customer: { name: 'Jane' },
    });
    providerMobile.checkInBooking.mockRejectedValue(
      new Error('Check-in is not allowed'),
    );

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Check in Jane',
      { bookingId: 'bk-4' },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not allowed');
  });

  it('surfaces generic check-in failures', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-8',
      customer: { name: 'Jane' },
    });
    providerMobile.checkInBooking.mockRejectedValue('blocked');

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Check in Jane',
      { bookingId: 'bk-8' },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Check-in failed');
  });

  it('surfaces running late errors from provider mobile', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-5',
      customer: { name: 'Jane' },
    });
    providerMobile.markBookingRunningLate.mockRejectedValue(
      new Error('Cannot update visit status'),
    );

    const result = await handleMarkRunningLateLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Running late for Jane',
      { bookingId: 'bk-5' },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Cannot update visit status');
  });

  it('returns null for unknown dispatch action', async () => {
    await expect(
      dispatchProviderExp2Intent(deps, 'biz-1', 'user-1', 'unknown_action', {}),
    ).resolves.toBeNull();
  });

  it.each([
    ['my_stats', handleMyStatsLogic],
    ['team_floor_status', handleTeamFloorStatusLogic],
    ['check_in_client', handleCheckInClientLogic],
    ['mark_running_late', handleMarkRunningLateLogic],
  ] as const)(
    'dispatches %s through dispatchProviderExp2Intent',
    async (action) => {
      providerMobile.getMyStats.mockResolvedValue({
        period: 'week',
        scope: 'mine',
        completedBookings: 1,
        paidRevenue: 50,
        currency: 'USD',
        utilizationPercent: 50,
        bookedMinutes: 60,
        scheduledMinutes: 120,
        averageReviewScore: null,
        newReviewsCount: 0,
        tipsEnabled: false,
      });
      providerMobile.resolveMobileAccess.mockResolvedValue({
        viewMode: 'team',
        employee: { id: 'emp-1' },
      });
      providerMobile.getTeamFloorToday.mockResolvedValue({
        date: '2026-06-09',
        totalBookings: 0,
        columns: [],
      });
      providerMobile.getBookingDetail.mockResolvedValue({
        id: 'bk-dispatch',
        customer: { name: 'Jane' },
      });
      providerMobile.checkInBooking.mockResolvedValue({
        checkedInAt: '2026-06-09T10:00:00.000Z',
        floorStatus: 'waiting',
      });
      providerMobile.markBookingRunningLate.mockResolvedValue({
        visitStatus: { minutesLate: 10 },
        floorStatus: 'waiting',
        notifications: { sent: true },
      });

      const result = await dispatchProviderExp2Intent(
        deps,
        'biz-1',
        'user-1',
        action,
        action === 'check_in_client' || action === 'mark_running_late'
          ? { bookingId: 'bk-dispatch' }
          : {},
        'test prompt',
        { bookingId: 'bk-dispatch' },
      );

      expect(result?.action).toBe(action);
      expect(result?.success).toBe(true);
    },
  );

  it('surfaces non-error running late failures', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-7',
      customer: { name: 'Jane' },
    });
    providerMobile.markBookingRunningLate.mockRejectedValue('blocked');

    const result = await handleMarkRunningLateLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Running late for Jane',
      { bookingId: 'bk-7' },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Could not update visit status');
  });

  it('uses explicit bookingId param before session context', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      id: 'bk-param',
      customer: { name: 'Jane' },
    });
    providerMobile.checkInBooking.mockResolvedValue({
      checkedInAt: '2026-06-09T10:00:00.000Z',
      floorStatus: 'waiting',
    });

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-param' },
      'Check in',
      { bookingId: 'bk-context' },
    );

    expect(result.success).toBe(true);
    expect(providerMobile.checkInBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-param',
    );
  });

  it('filters booking lookup by time slot', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'bk-morning',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        customer: { name: 'Jane Doe' },
      },
      {
        id: 'bk-afternoon',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-09T14:00:00.000Z'),
        customer: { name: 'Jane Doe' },
      },
    ]);
    providerMobile.checkInBooking.mockResolvedValue({
      checkedInAt: '2026-06-09T13:55:00.000Z',
      floorStatus: 'waiting',
    });

    const result = await handleCheckInClientLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Jane', timeSlot: '14:00' },
      'Check in Jane at 2pm',
    );

    expect(result.success).toBe(true);
    expect(providerMobile.checkInBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-afternoon',
    );
  });

  it('marks a booking ready now', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.markBookingReadyNow.mockResolvedValue({
      bookingId: 'bk-1',
      visitStatus: { kind: 'ready_now' },
      floorStatus: 'ready',
      notifications: null,
    });

    const result = await handleMarkReadyNowLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Mark ready now',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('mark_ready_now');
    expect(result.summary).toContain('Jane Doe');
    expect(providerMobile.markBookingReadyNow).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
    );
  });

  it('surfaces a mark ready now failure', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.markBookingReadyNow.mockRejectedValue(
      new Error('Visit status cannot be updated for this booking'),
    );

    const result = await handleMarkReadyNowLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Mark ready now',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Visit status cannot be updated');
  });

  it('suggests a cancel note', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.suggestCancelNote.mockResolvedValue({
      suggestion: 'Jane cancelled her haircut scheduled for today.',
      aiAvailable: true,
    });

    const result = await handleSuggestCancelNoteLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Draft a cancellation note',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('suggest_cancel_note');
    expect(result.summary).toBe(
      'Jane cancelled her haircut scheduled for today.',
    );
    expect(providerMobile.suggestCancelNote).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
      { draft: undefined, prompt: 'Draft a cancellation note' },
    );
  });

  it('requests a client review', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.requestBookingReview.mockResolvedValue({
      sent: true,
      bookingId: 'bk-1',
    });

    const result = await handleRequestClientReviewLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Ask Jane for a review',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Jane Doe');
    expect(result.details?.sent).toBe(true);
  });

  it('surfaces a request review failure', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.requestBookingReview.mockRejectedValue(
      new Error('Review request is not allowed for this booking'),
    );

    const result = await handleRequestClientReviewLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Ask Jane for a review',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not allowed');
  });

  it('lists reassign options', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.getBookingReassignOptions.mockResolvedValue({
      allowed: true,
      reason: null,
      date: '2026-06-09',
      timeSlot: '14:00',
      serviceName: 'Haircut',
      currentEmployee: { id: 'emp-1', name: 'Alex' },
      options: [
        { id: 'emp-2', name: 'Maria' },
        { id: 'emp-3', name: 'James' },
      ],
    });

    const result = await handleListReassignOptionsLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Who else is free to take this?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Maria');
    expect(result.summary).toContain('James');
  });

  it('reports when reassign is not allowed', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.getBookingReassignOptions.mockResolvedValue({
      allowed: false,
      reason: 'Only managers can reassign bookings',
      options: [],
    });

    const result = await handleListReassignOptionsLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Reassign options for this booking',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Only managers');
  });

  it('reassigns a booking to the named provider', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.getBookingReassignOptions.mockResolvedValue({
      allowed: true,
      reason: null,
      date: '2026-06-09',
      timeSlot: '14:00',
      serviceName: 'Haircut',
      currentEmployee: { id: 'emp-1', name: 'Alex' },
      options: [{ id: 'emp-2', name: 'Maria' }],
    });
    providerMobile.reassignBooking.mockResolvedValue({
      id: 'bk-1',
      employee: { id: 'emp-2', name: 'Maria' },
    });

    const result = await handleReassignBookingSameDayLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1', employeeName: 'Maria' },
      'Reassign this to Maria',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Maria');
    expect(providerMobile.reassignBooking).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'bk-1',
      { employeeId: 'emp-2' },
    );
  });

  it('clarifies when no target provider is named for reassign', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });

    const result = await handleReassignBookingSameDayLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1' },
      'Reassign this appointment',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('reports when the named provider is not free for reassign', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      customer: { name: 'Jane Doe' },
    });
    providerMobile.getBookingReassignOptions.mockResolvedValue({
      allowed: true,
      reason: null,
      date: '2026-06-09',
      timeSlot: '14:00',
      serviceName: 'Haircut',
      currentEmployee: { id: 'emp-1', name: 'Alex' },
      options: [{ id: 'emp-3', name: 'James' }],
    });

    const result = await handleReassignBookingSameDayLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'bk-1', employeeName: 'Maria' },
      'Reassign this to Maria',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain("isn't free");
  });
});
