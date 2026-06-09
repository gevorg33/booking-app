import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildProviderBookingCustomerContextView,
  readReferralCodeUsed,
} from './provider-booking-customer-context.util.js';

describe('provider-booking-customer-context.util (prov-exp-1.1)', () => {
  it('builds a full customer snapshot view', () => {
    const view = buildProviderBookingCustomerContextView({
      customer: {
        id: 'cust-1',
        name: 'Jane Doe',
        phone: '+15551234567',
        email: 'jane@example.com',
        metadata: {
          gdpr: { marketingOptIn: true },
          referredByCustomerId: 'cust-ref',
          referralCodeUsed: 'friend10',
        },
      },
      loyalty: {
        pointsBalance: 120,
        pointsValue: 12,
        lifetimeEarned: 200,
        lastEarn: {
          points: 10,
          createdAt: new Date('2026-05-01T10:00:00.000Z'),
          note: 'Earned from paid booking',
        },
        lastRedeem: {
          points: -5,
          createdAt: new Date('2026-04-15T09:00:00.000Z'),
          note: 'Redeemed on booking',
        },
      },
      completedVisitCount: 4,
      lastCompletedVisitAt: new Date('2026-05-01T14:00:00.000Z'),
      noShowCount: 1,
      referrer: { id: 'cust-ref', name: 'Alice Friend' },
    });

    expect(view).toEqual({
      customerId: 'cust-1',
      name: 'Jane Doe',
      phone: '+15551234567',
      email: 'jane@example.com',
      loyaltyPointsBalance: 120,
      loyaltyPointsValue: 12,
      loyaltyQuickView: {
        pointsBalance: 120,
        pointsValue: 12,
        lifetimeEarned: 200,
        lastEarn: {
          points: 10,
          occurredAt: '2026-05-01T10:00:00.000Z',
          note: 'Earned from paid booking',
        },
        lastRedeem: {
          points: 5,
          occurredAt: '2026-04-15T09:00:00.000Z',
          note: 'Redeemed on booking',
        },
        staffCanAdjust: false,
      },
      completedVisitCount: 4,
      lastCompletedVisitAt: '2026-05-01T14:00:00.000Z',
      noShowCount: 1,
      marketingOptIn: true,
      referral: {
        referredByCustomerId: 'cust-ref',
        referredByCustomerName: 'Alice Friend',
        referralCodeUsed: 'FRIEND10',
      },
      badges: [{ id: 'referred_by', tone: 'secondary', referredByCustomerName: 'Alice Friend' }],
      recentCompletedVisits: [],
    });
  });

  it('returns null marketing opt-in when gdpr metadata is missing', () => {
    const view = buildProviderBookingCustomerContextView({
      customer: { id: 'cust-1', name: 'Jane', metadata: {} },
      loyalty: {
        pointsBalance: 0,
        pointsValue: 0,
        lifetimeEarned: 0,
        lastEarn: null,
        lastRedeem: null,
      },
      completedVisitCount: 0,
      lastCompletedVisitAt: null,
      noShowCount: 0,
    });

    expect(view.marketingOptIn).toBeNull();
    expect(view.referral).toBeNull();
    expect(view.badges).toEqual([{ id: 'first_visit', tone: 'success' }]);
  });

  it('readReferralCodeUsed normalizes codes', () => {
    expect(readReferralCodeUsed({ referralCodeUsed: ' abc ' })).toBe('ABC');
    expect(readReferralCodeUsed({ referralCodeUsed: '' })).toBeNull();
  });

  it('ignores referral block when referrer record is missing', () => {
    const view = buildProviderBookingCustomerContextView({
      customer: {
        id: 'cust-1',
        name: 'Jane',
        metadata: { referredByCustomerId: 'missing' },
      },
      loyalty: {
        pointsBalance: 0,
        pointsValue: 0,
        lifetimeEarned: 0,
        lastEarn: null,
        lastRedeem: null,
      },
      completedVisitCount: 0,
      lastCompletedVisitAt: null,
      noShowCount: 0,
      referrer: null,
    });

    expect(view.referral).toBeNull();
  });

  it('documents booking status enums used for visit stats', () => {
    expect(BookingStatus.COMPLETED).toBe('completed');
    expect(BookingStatus.NO_SHOW).toBe('no_show');
  });
});
