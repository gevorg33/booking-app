import { buildClinicResultReadyLinks } from './clinic-result-ready-link.util.js';

describe('clinic-result-ready-link.util', () => {
  it('builds web and consumer deep links for result-ready notifications', () => {
    expect(
      buildClinicResultReadyLinks('city-clinic', 'https://app.test'),
    ).toEqual({
      webResultsUrl:
        'https://app.test/book/city-clinic/account?section=results',
      consumerAppUrl: 'optischedule://book/city-clinic/results',
      consumerWebUrl: 'https://app.test/s/city-clinic/results',
    });
  });

  it('returns null without a business slug', () => {
    expect(buildClinicResultReadyLinks('')).toBeNull();
    expect(buildClinicResultReadyLinks(null)).toBeNull();
  });
});
