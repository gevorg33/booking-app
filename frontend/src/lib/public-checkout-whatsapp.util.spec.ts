import { describe, expect, it } from 'vitest';
import {
  isWhatsappRemindersPhoneRequired,
  resolveDefaultPublicCheckoutWhatsappReminders,
  resolveWhatsappRemindersAfterPhonePrefill,
} from './public-checkout-whatsapp.util';

describe('public-checkout-whatsapp.util (e2e-bug.212)', () => {
  it.each([
    { id: 'guest-no-phone', phone: undefined, expected: false },
    { id: 'empty-string', phone: '', expected: false },
    { id: 'whitespace', phone: '   ', expected: false },
    { id: 'has-phone', phone: '+37499111222', expected: true },
    { id: 'null', phone: null, expected: false },
  ])(
    'resolveDefaultPublicCheckoutWhatsappReminders: $id',
    ({ phone, expected }) => {
      expect(resolveDefaultPublicCheckoutWhatsappReminders(phone)).toBe(expected);
    },
  );

  it.each([
    {
      id: 'whatsapp-on-no-phone',
      whatsappReminders: true,
      phone: undefined,
      expected: true,
    },
    {
      id: 'whatsapp-on-with-phone',
      whatsappReminders: true,
      phone: '+1 555 0100',
      expected: false,
    },
    {
      id: 'whatsapp-off-no-phone',
      whatsappReminders: false,
      phone: undefined,
      expected: false,
    },
    {
      id: 'whatsapp-off-with-phone',
      whatsappReminders: false,
      phone: '+1 555 0100',
      expected: false,
    },
  ])(
    'isWhatsappRemindersPhoneRequired: $id',
    ({ whatsappReminders, phone, expected }) => {
      expect(isWhatsappRemindersPhoneRequired(whatsappReminders, phone)).toBe(
        expected,
      );
    },
  );

  it('prefill: enables WhatsApp when auth supplies first phone', () => {
    expect(
      resolveWhatsappRemindersAfterPhonePrefill({
        previousPhone: undefined,
        nextPhone: '+37499111222',
        previousWhatsappReminders: false,
      }),
    ).toBe(true);
  });

  it('prefill: does not override guest who already toggled / typed phone', () => {
    expect(
      resolveWhatsappRemindersAfterPhonePrefill({
        previousPhone: '+37499000000',
        nextPhone: '+37499111222',
        previousWhatsappReminders: false,
      }),
    ).toBe(false);
  });

  it('prefill: keeps OFF when next phone still empty', () => {
    expect(
      resolveWhatsappRemindersAfterPhonePrefill({
        previousPhone: undefined,
        nextPhone: '',
        previousWhatsappReminders: false,
      }),
    ).toBe(false);
  });

  it('documents the bug: guest default must be OFF', () => {
    expect(resolveDefaultPublicCheckoutWhatsappReminders()).toBe(false);
    expect(isWhatsappRemindersPhoneRequired(false, undefined)).toBe(false);
    expect(isWhatsappRemindersPhoneRequired(true, undefined)).toBe(true);
  });
});
