import { E2E235_WAITLIST_SUMMARY_SCENARIOS } from '../../modules/ai/ai-customer-waitlist.fixtures.js';
import {
  applyCustomerWaitlistRequestToMetadata,
  buildCheckWaitlistStatusSummary,
  buildCustomerWaitlistRequest,
  buildJoinWaitlistSuccessSummary,
  ensureWaitlistTag,
  formatCustomerWaitlistPreferenceSummary,
  hasWaitlistTag,
  readCustomerWaitlistRequest,
  removeWaitlistTag,
  stripTrailingWaitlistProviderFromService,
  waitlistServiceAlreadyNamesEmployee,
} from './customer-waitlist.util.js';

describe('customer-waitlist.util', () => {
  it('manages waitlist tag and metadata', () => {
    expect(hasWaitlistTag(['vip'])).toBe(false);
    expect(ensureWaitlistTag(['vip'])).toEqual(['vip', 'waitlist']);
    expect(removeWaitlistTag(['vip', 'waitlist'])).toEqual(['vip']);

    const request = buildCustomerWaitlistRequest({
      serviceName: 'Massage',
      date: '2030-06-01',
      timeOfDay: 'afternoon',
    });
    const metadata = applyCustomerWaitlistRequestToMetadata({}, request);
    expect(readCustomerWaitlistRequest(metadata)).toMatchObject({
      serviceName: 'Massage',
      status: 'active',
    });
  });

  it('builds user-facing summaries', () => {
    const request = buildCustomerWaitlistRequest({
      serviceName: 'Haircut',
      date: '2030-06-01',
    });
    expect(buildJoinWaitlistSuccessSummary(request)).toMatch(
      /on the waitlist/i,
    );
    expect(
      buildCheckWaitlistStatusSummary({ onWaitlist: true, request }),
    ).toMatch(/You're on the waitlist/);
    expect(
      buildCheckWaitlistStatusSummary({ onWaitlist: false, request: null }),
    ).toMatch(/not on the waitlist/i);
  });

  it('formats preference ranges and defaults', () => {
    expect(
      formatCustomerWaitlistPreferenceSummary(
        buildCustomerWaitlistRequest({
          serviceName: 'Massage',
          employeeName: 'Anna',
          dateFrom: '2030-06-01',
          dateTo: '2030-06-05',
          timeSlot: '14:00',
        }),
      ),
    ).toMatch(/between 2030-06-01 and 2030-06-05/);
    expect(
      formatCustomerWaitlistPreferenceSummary(
        buildCustomerWaitlistRequest({ dateFrom: '2030-06-01' }),
      ),
    ).toMatch(/from 2030-06-01/);
    expect(
      formatCustomerWaitlistPreferenceSummary(buildCustomerWaitlistRequest({})),
    ).toMatch(/any upcoming opening/);
  });

  it.each(E2E235_WAITLIST_SUMMARY_SCENARIOS)(
    'e2e-bug.235 preference summary ($id)',
    ({ serviceName, employeeName, date, expectedSummary, forbidden }) => {
      const request = buildCustomerWaitlistRequest({
        ...(serviceName ? { serviceName } : {}),
        ...(employeeName ? { employeeName } : {}),
        date,
      });
      const prefs = formatCustomerWaitlistPreferenceSummary(request);
      expect(prefs).toBe(expectedSummary);
      for (const bad of forbidden) {
        expect(prefs).not.toContain(bad);
        expect(buildJoinWaitlistSuccessSummary(request)).not.toContain(bad);
        expect(
          buildCheckWaitlistStatusSummary({ onWaitlist: true, request }),
        ).not.toContain(bad);
      }
    },
  );

  it('e2e-bug.235 strip / already-names helpers', () => {
    expect(
      stripTrailingWaitlistProviderFromService(
        'Swedish massage with Gevorg',
        'Gevorg',
      ),
    ).toBe('Swedish massage');
    expect(
      stripTrailingWaitlistProviderFromService(
        'Swedish massage with Gevorg',
        'Gevorg Gasparyan',
      ),
    ).toBe('Swedish massage');
    expect(
      waitlistServiceAlreadyNamesEmployee(
        'Swedish massage with Gevorg',
        'Gevorg Gasparyan',
      ),
    ).toBe(true);
    expect(
      waitlistServiceAlreadyNamesEmployee('Swedish massage', 'Gevorg'),
    ).toBe(false);
  });
});
