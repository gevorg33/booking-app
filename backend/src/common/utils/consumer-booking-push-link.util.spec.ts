import {
  buildConsumerBookingManagePushUrl,
  buildConsumerBookServicePushUrl,
  buildConsumerGiftCardPushUrl,
  buildConsumerSalonHomePushUrl,
} from './consumer-booking-push-link.util.js';

describe('consumer-booking-push-link.util', () => {
  it('builds manage booking push deep link', () => {
    expect(
      buildConsumerBookingManagePushUrl('glow-nails', 'b-1', 'token-abc'),
    ).toBe(
      'optischedule://book/glow-nails/manage?bookingId=b-1&token=token-abc',
    );
  });

  it('builds salon home and gift card push deep links', () => {
    expect(buildConsumerSalonHomePushUrl('spa-one')).toBe(
      'optischedule://book/spa-one',
    );
    expect(buildConsumerGiftCardPushUrl('spa-one')).toBe(
      'optischedule://book/spa-one',
    );
    expect(buildConsumerBookServicePushUrl('spa-one', 'svc-1')).toBe(
      'optischedule://book/spa-one/book/svc-1',
    );
  });
});
