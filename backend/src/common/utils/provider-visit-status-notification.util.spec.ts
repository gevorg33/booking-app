import {
  buildProviderVisitStatusCustomerSms,
  normalizeProviderRunningLateMinutes,
} from './provider-visit-status-notification.util.js';

describe('provider-visit-status-notification.util (prov-exp-3.2)', () => {
  it('normalizes running late minutes', () => {
    expect(normalizeProviderRunningLateMinutes(undefined)).toBe(10);
    expect(normalizeProviderRunningLateMinutes(25)).toBe(25);
  });

  it('builds SMS bodies', () => {
    expect(
      buildProviderVisitStatusCustomerSms({
        kind: 'ready_now',
        businessName: 'Glow',
        providerName: 'Alex',
        serviceName: 'Cut',
      }),
    ).toContain('ready for you now');
    expect(
      buildProviderVisitStatusCustomerSms({
        kind: 'running_late',
        minutesLate: 10,
        businessName: 'Glow',
        providerName: 'Alex',
        serviceName: '',
      }),
    ).toContain('your appointment');
  });
});
