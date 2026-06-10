import { BadRequestException } from '@nestjs/common';
import { CUSTOMER_NOTIFICATION_LOCALE_SCENARIOS } from './customer-notification-locale.fixtures.js';
import {
  applyCustomerPreferredLocale,
  assertCustomerPreferredLocale,
  readCustomerPreferredLocale,
  resolveCustomerNotificationLocale,
} from './customer-notification-locale.util.js';

describe('customer-notification-locale.util (catalog-notify-1.2)', () => {
  describe('readCustomerPreferredLocale', () => {
    it.each([
      ['hy', 'hy'],
      [' HY ', 'hy'],
      ['de', null],
      [undefined, null],
    ])('reads %s as %s', (input, expected) => {
      expect(
        readCustomerPreferredLocale(
          input === undefined ? {} : { preferredLocale: input },
        ),
      ).toBe(expected);
    });
  });

  describe('applyCustomerPreferredLocale', () => {
    it('sets preferredLocale and preserves other metadata', () => {
      expect(
        applyCustomerPreferredLocale({ pushNews: true }, 'ru'),
      ).toEqual({
        pushNews: true,
        preferredLocale: 'ru',
      });
    });
  });

  describe('resolveCustomerNotificationLocale', () => {
    it.each(CUSTOMER_NOTIFICATION_LOCALE_SCENARIOS)(
      '$id',
      ({ metadata, businessSettings, expected }) => {
        expect(
          resolveCustomerNotificationLocale(metadata, businessSettings),
        ).toBe(expected);
      },
    );
  });

  describe('assertCustomerPreferredLocale', () => {
    it('accepts enabled locale', () => {
      expect(
        assertCustomerPreferredLocale('hy', {
          enabledLocales: ['en', 'hy'],
        }),
      ).toBe('hy');
    });

    it('rejects unsupported code', () => {
      expect(() => assertCustomerPreferredLocale('de', {})).toThrow(
        BadRequestException,
      );
    });

    it('rejects disabled locale', () => {
      expect(() =>
        assertCustomerPreferredLocale('ru', {
          enabledLocales: ['en', 'hy'],
        }),
      ).toThrow(BadRequestException);
    });
  });
});
