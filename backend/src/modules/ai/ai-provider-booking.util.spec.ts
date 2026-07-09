import {
  PROVIDER_BOOKING_INTENTS,
  decomposeProviderBookingCompoundPrompt,
  extractBookingIdFromPrompt,
  isDashboardPackageMultiScopePrompt,
  isListMyMultiServiceGroupsPrompt,
  isListMyPackageVisitsPrompt,
  isListPackageAppointmentsTodayPrompt,
  isProviderBookingCompoundPrompt,
  isProviderMarkPaidPrompt,
  isProviderSelfScopePrompt,
  isProviderBookingIntent,
  rescueProviderBookingIntent,
} from './ai-provider-booking.util.js';
import { PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_PROMPT_SCENARIOS } from './ai-provider-list-my-multi-service-groups.fixtures.js';

describe('ai-provider-booking.util', () => {
  it('registers provider booking intents', () => {
    expect(PROVIDER_BOOKING_INTENTS).toContain(
      'list_package_appointments_today',
    );
    expect(PROVIDER_BOOKING_INTENTS).toContain('mark_paid');
    for (const intent of PROVIDER_BOOKING_INTENTS) {
      expect(isProviderBookingIntent(intent)).toBe(true);
    }
    expect(isProviderBookingIntent('list_package_bookings')).toBe(false);
  });

  it('classifies provider-scoped package and multi-service prompts', () => {
    expect(
      isListPackageAppointmentsTodayPrompt(
        'Show my package appointments today',
      ),
    ).toBe(true);
    expect(
      isListMyPackageVisitsPrompt('List my package visits this week'),
    ).toBe(true);
    expect(
      isListMyMultiServiceGroupsPrompt('Show my multi-service groups today'),
    ).toBe(true);
    expect(
      isListMyMultiServiceGroupsPrompt('Show my multi-service on my calendar'),
    ).toBe(true);
    expect(isProviderMarkPaidPrompt('Mark booking paid')).toBe(true);
    expect(
      isDashboardPackageMultiScopePrompt('List package visits this week'),
    ).toBe(true);
    expect(
      isDashboardPackageMultiScopePrompt('Book package for customer Anna'),
    ).toBe(true);
    expect(isDashboardPackageMultiScopePrompt('List all package visits')).toBe(
      true,
    );
    expect(
      isListPackageAppointmentsTodayPrompt('List package visits this week'),
    ).toBe(false);
    expect(
      isListPackageAppointmentsTodayPrompt('List my package visits today'),
    ).toBe(true);
    expect(
      isListPackageAppointmentsTodayPrompt(
        'Show my multi-service appointments today',
      ),
    ).toBe(false);
    expect(isProviderMarkPaidPrompt('Payment sweep for today')).toBe(false);
    expect(isProviderMarkPaidPrompt('Mark paid for customer Anna')).toBe(false);
    expect(
      isDashboardPackageMultiScopePrompt('List my package visits this week'),
    ).toBe(false);
    expect(isProviderSelfScopePrompt('on my calendar show package')).toBe(true);
    expect(isProviderSelfScopePrompt('I have package visits')).toBe(true);
    expect(
      extractBookingIdFromPrompt('mark appointment abcdef123456 paid'),
    ).toBe('abcdef123456');
  });

  it('decomposes compound provider booking prompts', () => {
    expect(
      isProviderBookingCompoundPrompt(
        'Show my package appointments today and list my multi-service groups',
      ),
    ).toBe(true);
    const steps = decomposeProviderBookingCompoundPrompt(
      'List my package visits this week and mark booking book-abcdef123456 paid',
    );
    expect(steps).toHaveLength(2);
    expect(steps[0].action).toBe('list_my_package_visits');
    expect(steps[1].action).toBe('mark_paid');
    expect(steps[1].params.bookingId).toBe('book-abcdef123456');

    expect(
      decomposeProviderBookingCompoundPrompt(
        'Show my package appointments today then mark booking book-abcdef123456 paid',
      ),
    ).toHaveLength(2);

    expect(
      decomposeProviderBookingCompoundPrompt(
        'Show my package appointments today and list something random only',
      ),
    ).toHaveLength(1);
  });

  it('covers remaining util branches', () => {
    expect(decomposeProviderBookingCompoundPrompt('')).toEqual([]);
    expect(decomposeProviderBookingCompoundPrompt('hello world')).toEqual([]);
    expect(
      decomposeProviderBookingCompoundPrompt('mark paid only'),
    ).toHaveLength(1);
    expect(
      decomposeProviderBookingCompoundPrompt('book something weird only'),
    ).toEqual([]);
    expect(
      decomposeProviderBookingCompoundPrompt('list package; ;mark paid'),
    ).toHaveLength(1);
    expect(isProviderMarkPaidPrompt('mark payment as complete')).toBe(true);
    expect(isProviderMarkPaidPrompt('mark payment received')).toBe(true);
    expect(
      rescueProviderBookingIntent(
        'List my package visits',
        'list_my_package_visits',
      ),
    ).toBeNull();
    expect(
      rescueProviderBookingIntent('List my package visits this week', 'unknown')
        ?.action,
    ).toBe('list_my_package_visits');
    expect(
      rescueProviderBookingIntent('cancel my booking', 'unknown'),
    ).toBeNull();
    expect(
      rescueProviderBookingIntent('Mark booking paid', 'payment_sweep'),
    ).toBeNull();
    expect(
      rescueProviderBookingIntent('Mark booking paid', 'collect_cash_confirm'),
    ).toBeNull();
  });

  it('rescues provider booking intents', () => {
    const prompts: Array<[string, string]> = [
      ['Show my package appointments today', 'list_package_appointments_today'],
      ['List my package visits this week', 'list_my_package_visits'],
      ['List my multi-service groups', 'list_my_multi_service_groups'],
      ['Mark booking paid', 'mark_paid'],
    ];
    for (const [prompt, action] of prompts) {
      expect(rescueProviderBookingIntent(prompt, 'unknown')?.action).toBe(
        action,
      );
    }
    expect(
      rescueProviderBookingIntent('Mark booking paid', 'update_bookings')
        ?.action,
    ).toBe('mark_paid');
    expect(
      rescueProviderBookingIntent('Mark booking paid', 'mark_paid'),
    ).toBeNull();
    expect(
      rescueProviderBookingIntent(
        'Show my package appointments today and mark booking paid',
        'unknown',
      ),
    ).toBeNull();
  });

  it.each(
    PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )(
    'detects list_my_multi_service_groups prompt %s (ai-cmd-provider-5.18.1)',
    (_id, prompt) => {
      expect(isListMyMultiServiceGroupsPrompt(prompt)).toBe(true);
      expect(rescueProviderBookingIntent(prompt, 'unknown')?.action).toBe(
        'list_my_multi_service_groups',
      );
    },
  );
});
