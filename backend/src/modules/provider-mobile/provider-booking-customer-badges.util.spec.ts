import { PROVIDER_CUSTOMER_SNAPSHOT_BADGE_SCENARIOS } from './provider-booking-customer-badges.fixtures.js';
import {
  daysSinceDate,
  formatProviderCustomerSnapshotBadgeLabel,
  formatProviderCustomerSnapshotBadgesText,
  isFirstVisitCustomer,
  isWinBackCustomer,
  resolveProviderCustomerSnapshotBadges,
} from './provider-booking-customer-badges.util.js';

describe('provider-booking-customer-badges.util (prov-exp-9.1)', () => {
  it.each(PROVIDER_CUSTOMER_SNAPSHOT_BADGE_SCENARIOS)(
    'resolveProviderCustomerSnapshotBadges — $id',
    ({ input, expectedBadgeIds }) => {
      const badges = resolveProviderCustomerSnapshotBadges(input);
      expect(badges.map((badge) => badge.id)).toEqual(expectedBadgeIds);
    },
  );

  it('computes whole-day gaps for win-back threshold', () => {
    const reference = new Date('2026-06-09T12:00:00.000Z');
    const lastVisit = new Date('2026-03-11T12:00:00.000Z');
    expect(daysSinceDate(lastVisit, reference)).toBe(90);
    expect(
      isWinBackCustomer({
        completedVisitCount: 2,
        lastCompletedVisitAt: lastVisit,
        inactiveDaysThreshold: 90,
        referenceDate: reference,
      }),
    ).toBe(true);
    expect(
      isWinBackCustomer({
        completedVisitCount: 2,
        lastCompletedVisitAt: new Date('2026-03-12T12:00:00.000Z'),
        inactiveDaysThreshold: 90,
        referenceDate: reference,
      }),
    ).toBe(false);
  });

  it('detects first visit only when completed count is zero', () => {
    expect(isFirstVisitCustomer(0)).toBe(true);
    expect(isFirstVisitCustomer(1)).toBe(false);
  });

  it('formats badge labels for AI summaries', () => {
    const badges = resolveProviderCustomerSnapshotBadges({
      completedVisitCount: 0,
      lastCompletedVisitAt: null,
      referral: {
        referredByCustomerId: 'cust-ref',
        referredByCustomerName: 'Alice Friend',
        referralCodeUsed: null,
      },
      inactiveDaysThreshold: 90,
    });

    expect(formatProviderCustomerSnapshotBadgesText(badges)).toBe(
      'First visit, Referred by Alice Friend',
    );
    expect(formatProviderCustomerSnapshotBadgeLabel(badges[1])).toBe(
      'Referred by Alice Friend',
    );
    expect(formatProviderCustomerSnapshotBadgesText([])).toBeNull();
    expect(
      formatProviderCustomerSnapshotBadgeLabel({
        id: 'win_back',
        tone: 'tertiary',
      }),
    ).toBe('Win-back');
  });

  it('treats future last-visit dates as zero days since visit', () => {
    const reference = new Date('2026-06-09T12:00:00.000Z');
    const futureVisit = new Date('2026-07-01T12:00:00.000Z');
    expect(daysSinceDate(futureVisit, reference)).toBe(0);
  });

  it('falls back when referrer name is missing', () => {
    expect(
      formatProviderCustomerSnapshotBadgeLabel({
        id: 'referred_by',
        tone: 'secondary',
      }),
    ).toBe('Referred by another client');
  });

  it('uses current date when reference date is omitted for win-back', () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 120);
    expect(
      isWinBackCustomer({
        completedVisitCount: 1,
        lastCompletedVisitAt: lastVisit,
        inactiveDaysThreshold: 90,
      }),
    ).toBe(true);
  });
});
