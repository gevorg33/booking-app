import { buildServerReferralConvertedEvent } from './referral-conversion-analytics.util.js';

describe('referral-conversion-analytics.util', () => {
  it('builds referral_converted server event payload', () => {
    const payload = buildServerReferralConvertedEvent({
      businessId: 'biz-1',
      tenantSlug: 'demo-salon',
      bookingId: 'bk-1',
      referrerCustomerId: 'referrer-1',
      refereeCustomerId: 'referee-1',
      referralCode: 'friend10',
    });
    expect(payload.event).toBe('referral_converted');
    expect(payload.platform).toBe('web');
    expect(payload.appSurface).toBe('public_web');
    expect(payload.props).toMatchObject({
      bookingId: 'bk-1',
      referrerCustomerId: 'referrer-1',
      referralCode: 'FRIEND10',
      source: 'server',
    });
  });
});
