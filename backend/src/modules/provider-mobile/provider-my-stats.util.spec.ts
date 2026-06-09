import { BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import {
  PROVIDER_MY_STATS_PERIOD_SCENARIOS,
  PROVIDER_MY_STATS_TIPS_SCENARIOS,
  PROVIDER_MY_STATS_UTILIZATION_SCENARIOS,
} from './provider-my-stats.fixtures.js';
import {
  buildProviderMyStatsView,
  canRequestProviderTeamStatsRollup,
  computeProviderUtilizationPercent,
  countCompletedBookings,
  countDaysInclusive,
  fallbackScheduledMinutes,
  normalizeProviderMyStatsPeriod,
  normalizeProviderMyStatsScope,
  resolveProviderMyStatsPeriodRange,
  sumBookableSchedulingPeriodMinutes,
  sumPaidRevenueFromBookings,
  summarizeReviewsInPeriod,
  summarizeTipsFromBookings,
} from './provider-my-stats.util.js';

describe('provider-my-stats.util (prov-exp-2.1)', () => {
  it.each(PROVIDER_MY_STATS_PERIOD_SCENARIOS)(
    'resolveProviderMyStatsPeriodRange — $id',
    ({ period, todayKey, start, end }) => {
      expect(resolveProviderMyStatsPeriodRange(period, todayKey)).toEqual({
        from: start,
        to: end,
      });
    },
  );

  it.each(PROVIDER_MY_STATS_UTILIZATION_SCENARIOS)(
    'computeProviderUtilizationPercent — $id',
    ({ bookedMinutes, scheduledMinutes, expectedPercent }) => {
      expect(
        computeProviderUtilizationPercent(bookedMinutes, scheduledMinutes),
      ).toBe(expectedPercent);
    },
  );

  it('normalizes period and scope query params', () => {
    expect(normalizeProviderMyStatsPeriod('month')).toBe('month');
    expect(normalizeProviderMyStatsPeriod(undefined)).toBe('week');
    expect(normalizeProviderMyStatsScope('team')).toBe('team');
    expect(normalizeProviderMyStatsScope(undefined)).toBe('mine');
  });

  it('detects manager team rollup access', () => {
    expect(canRequestProviderTeamStatsRollup('owner')).toBe(true);
    expect(canRequestProviderTeamStatsRollup('manager')).toBe(true);
    expect(canRequestProviderTeamStatsRollup('staff')).toBe(false);
  });

  it('sums only service-block scheduled minutes', () => {
    const start = new Date('2026-06-09T09:00:00.000Z');
    const end = new Date('2026-06-09T12:00:00.000Z');
    expect(
      sumBookableSchedulingPeriodMinutes([
        { startTime: start, endTime: end, type: TemplatePeriodType.SERVICE_BLOCK },
        {
          startTime: start,
          endTime: end,
          type: TemplatePeriodType.UNAVAILABLE_BLOCK,
        },
      ]),
    ).toBe(180);
  });

  it('builds stats view with paid revenue, utilization, and reviews', () => {
    const view = buildProviderMyStatsView({
      period: 'week',
      scope: 'mine',
      range: { from: '2026-06-09', to: '2026-06-15' },
      canTeamRollup: false,
      currency: 'USD',
      employeeCount: 1,
      bookings: [
        {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date('2026-06-09T10:00:00.000Z'),
          endTime: new Date('2026-06-09T11:00:00.000Z'),
          service: { price: 80 },
          metadata: null,
        },
        {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.UNPAID,
          startTime: new Date('2026-06-10T10:00:00.000Z'),
          endTime: new Date('2026-06-10T11:30:00.000Z'),
          service: { price: 60 },
          metadata: null,
        },
      ],
      periods: [
        {
          startTime: new Date('2026-06-09T09:00:00.000Z'),
          endTime: new Date('2026-06-09T17:00:00.000Z'),
          type: TemplatePeriodType.SERVICE_BLOCK,
        },
      ],
      reviews: [
        { rating: 5, createdAt: new Date('2026-06-09T18:00:00.000Z') },
        { rating: 4, createdAt: new Date('2026-06-10T18:00:00.000Z') },
      ],
    });

    expect(view.completedBookings).toBe(1);
    expect(view.paidRevenue).toBe(80);
    expect(view.utilizationPercent).toBe(31);
    expect(view.newReviewsCount).toBe(2);
    expect(view.averageReviewScore).toBe(4.5);
    expect(view.tipsEnabled).toBe(false);
    expect(view.tipTotal).toBeUndefined();
  });

  it.each(PROVIDER_MY_STATS_TIPS_SCENARIOS)(
    'summarizeTipsFromBookings — $id',
    ({ bookings, expectedTotal, expectedCount }) => {
      const normalized = bookings.map((booking) => ({
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        startTime: new Date(),
        endTime: new Date(),
        metadata: booking.metadata,
      }));
      expect(summarizeTipsFromBookings(normalized)).toEqual({
        tipTotal: expectedTotal,
        tippedVisitCount: expectedCount,
      });
    },
  );

  it('includes tip totals when tipsEnabled on stats view', () => {
    const view = buildProviderMyStatsView({
      period: 'week',
      scope: 'mine',
      range: { from: '2026-06-09', to: '2026-06-15' },
      canTeamRollup: false,
      currency: 'USD',
      employeeCount: 1,
      tipsEnabled: true,
      bookings: [
        {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date(),
          endTime: new Date(),
          metadata: { payment: { tipAmount: 7.5 } },
        },
      ],
      periods: [],
      reviews: [],
    });

    expect(view.tipsEnabled).toBe(true);
    expect(view.tipTotal).toBe(7.5);
    expect(view.tippedVisitCount).toBe(1);
  });

  it('omits tip totals when tips feature is disabled', () => {
    const view = buildProviderMyStatsView({
      period: 'week',
      scope: 'mine',
      range: { from: '2026-06-09', to: '2026-06-15' },
      canTeamRollup: false,
      currency: 'USD',
      employeeCount: 1,
      tipsEnabled: false,
      bookings: [
        {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date(),
          endTime: new Date(),
          metadata: { payment: { tipAmount: 7.5 } },
        },
      ],
      periods: [],
      reviews: [],
    });

    expect(view.tipsEnabled).toBe(false);
    expect(view.tipTotal).toBeUndefined();
    expect(view.tippedVisitCount).toBeUndefined();
  });

  it('counts completed bookings and paid revenue independently', () => {
    expect(
      countCompletedBookings([
        { status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, startTime: new Date(), endTime: new Date(), service: { price: 10 } },
        { status: BookingStatus.NO_SHOW, paymentStatus: PaymentStatus.UNPAID, startTime: new Date(), endTime: new Date(), service: { price: 10 } },
      ]),
    ).toBe(1);
    expect(
      sumPaidRevenueFromBookings([
        {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          startTime: new Date(),
          endTime: new Date(),
          service: { price: 45.5 },
          metadata: null,
        },
      ]),
    ).toBe(45.5);
    expect(summarizeReviewsInPeriod([])).toEqual({
      averageReviewScore: null,
      newReviewsCount: 0,
    });
    expect(
      summarizeReviewsInPeriod([{ rating: 3, createdAt: new Date() }]),
    ).toEqual({ averageReviewScore: 3, newReviewsCount: 1 });
  });

  it('counts inclusive days and fallback scheduled minutes', () => {
    expect(countDaysInclusive({ from: '2026-06-08', to: '2026-06-14' })).toBe(7);
    expect(fallbackScheduledMinutes({ from: '2026-06-08', to: '2026-06-14' }, 2)).toBe(
      7 * 8 * 60 * 2,
    );
  });

  it('falls back to capacity hours when no schedule periods exist', () => {
    const view = buildProviderMyStatsView({
      period: 'week',
      scope: 'mine',
      range: { from: '2026-06-08', to: '2026-06-14' },
      canTeamRollup: false,
      currency: 'USD',
      employeeCount: 1,
      bookings: [
        {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.UNPAID,
          startTime: new Date('2026-06-09T10:00:00.000Z'),
          endTime: new Date('2026-06-09T12:00:00.000Z'),
          service: { price: 50 },
          metadata: null,
        },
      ],
      periods: [],
      reviews: [],
    });

    expect(view.scheduledMinutes).toBe(7 * 8 * 60);
    expect(view.utilizationPercent).toBeGreaterThan(0);
  });
});
