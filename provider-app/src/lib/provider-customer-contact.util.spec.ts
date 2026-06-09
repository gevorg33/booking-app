import { describe, expect, it } from 'vitest';
import {
  buildCustomerSmsLink,
  buildCustomerTelLink,
  buildCustomerWhatsAppLink,
  buildStaffContactedCustomerAnalyticsProps,
} from './provider-customer-contact.util';

describe('provider-customer-contact.util (prov-exp-6.1)', () => {
  it('builds native contact links', () => {
    expect(buildCustomerTelLink('+1 555 123 4567')).toBe('tel:+1 555 123 4567');
    expect(buildCustomerSmsLink('+1 555 123 4567')).toBe('sms:+1 555 123 4567');
    expect(buildCustomerWhatsAppLink('+1 555 123 4567')).toBe(
      'https://wa.me/15551234567',
    );
  });

  it('builds analytics props without message body', () => {
    expect(
      buildStaffContactedCustomerAnalyticsProps('bk-1', 'whatsapp'),
    ).toEqual({
      bookingId: 'bk-1',
      contactChannel: 'whatsapp',
    });
  });
});
