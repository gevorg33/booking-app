import { buildClinicLabBookingRequestLinks } from './clinic-lab-booking-request-link.util.js';

describe('clinic-lab-booking-request-link.util', () => {
  it('builds web and consumer deep links for lab booking requests', () => {
    expect(
      buildClinicLabBookingRequestLinks('city-clinic', 'https://app.test'),
    ).toEqual({
      webAccountUrl:
        'https://app.test/book/city-clinic/account?section=lab-requests',
      consumerAppUrl: 'optischedule://book/city-clinic/lab-requests',
      consumerWebUrl: 'https://app.test/s/city-clinic/results',
    });
  });

  it('includes service and token query params for direct in-app booking', () => {
    expect(
      buildClinicLabBookingRequestLinks('city-clinic', 'https://app.test', {
        collectionServiceId: 'svc-1',
        clinicOrderToken: 'token-abc',
      }),
    ).toEqual({
      webAccountUrl:
        'https://app.test/book/city-clinic/account?section=lab-requests',
      consumerAppUrl:
        'optischedule://book/city-clinic/lab-requests?serviceId=svc-1&clinicOrderToken=token-abc',
      consumerWebUrl:
        'https://app.test/s/city-clinic/lab-requests?serviceId=svc-1&clinicOrderToken=token-abc',
    });
  });

  it('returns null without a business slug', () => {
    expect(buildClinicLabBookingRequestLinks('')).toBeNull();
    expect(buildClinicLabBookingRequestLinks(null)).toBeNull();
  });
});
