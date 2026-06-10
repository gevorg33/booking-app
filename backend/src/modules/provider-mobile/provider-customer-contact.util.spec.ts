import {
  PROVIDER_CUSTOMER_CONTACT_FLAGS_SCENARIOS,
  PROVIDER_CUSTOMER_CONTACT_LINK_SCENARIOS,
  PROVIDER_STAFF_CONTACT_ANALYTICS_SCENARIOS,
} from './provider-customer-contact.fixtures.js';
import {
  buildCustomerSmsLink,
  buildCustomerTelLink,
  buildCustomerWhatsAppLink,
  buildProviderCustomerContactView,
  buildStaffContactedCustomerAnalyticsProps,
  isStaffContactChannel,
} from './provider-customer-contact.util.js';

describe('provider-customer-contact.util (prov-exp-6.1)', () => {
  it.each(PROVIDER_CUSTOMER_CONTACT_LINK_SCENARIOS.map((s) => [s.id, s]))(
    'builds contact links for %s',
    (_id, scenario) => {
      expect(buildCustomerTelLink(scenario.phone)).toBe(scenario.expectedTel);
      expect(buildCustomerSmsLink(scenario.phone)).toBe(scenario.expectedSms);
      expect(buildCustomerWhatsAppLink(scenario.phone)).toBe(
        scenario.expectedWhatsApp,
      );
    },
  );

  it.each(PROVIDER_CUSTOMER_CONTACT_FLAGS_SCENARIOS.map((s) => [s.id, s]))(
    'resolves contact flags for %s',
    (_id, scenario) => {
      expect(
        buildProviderCustomerContactView({
          customerPhone: scenario.customerPhone,
          whatsappEnabledSetting: scenario.whatsappEnabledSetting,
          whatsappConfigured: scenario.whatsappConfigured,
        }),
      ).toEqual(scenario.expected);
    },
  );

  it.each(PROVIDER_STAFF_CONTACT_ANALYTICS_SCENARIOS.map((s) => [s.id, s]))(
    'builds analytics props for %s',
    (_id, scenario) => {
      expect(
        buildStaffContactedCustomerAnalyticsProps(
          scenario.bookingId,
          scenario.channel,
        ),
      ).toEqual(scenario.expected);
    },
  );

  it('validates staff contact channels', () => {
    expect(isStaffContactChannel('call')).toBe(true);
    expect(isStaffContactChannel('email')).toBe(false);
  });
});
