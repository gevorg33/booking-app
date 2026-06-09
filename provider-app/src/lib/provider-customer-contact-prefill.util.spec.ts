import { describe, expect, it } from 'vitest';
import {
  buildCustomerSmsLinkWithBody,
  buildCustomerWhatsAppLinkWithBody,
} from './provider-customer-contact.util';

describe('provider-customer-contact prefilled links (prov-exp-6.2)', () => {
  it('builds sms and whatsapp links with encoded body', () => {
    expect(
      buildCustomerSmsLinkWithBody('+15551234567', 'Running late'),
    ).toBe('sms:+15551234567?body=Running%20late');
    expect(
      buildCustomerWhatsAppLinkWithBody('+15551234567', 'Running late'),
    ).toBe('https://wa.me/15551234567?text=Running%20late');
  });
});
