import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  dispatchProviderExp2Intent,
  handleCheckInClientLogic,
  handleMarkRunningLateLogic,
  handleMyStatsLogic,
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
  };

  const deps = {
    bookingRepo: bookingRepo as any,
    businessService: businessService as any,
    providerMobile: providerMobile as any,
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
      dispatchProviderExp2Intent(
        deps,
        'biz-1',
        'user-1',
        'unknown_action',
        {},
      ),
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
});
