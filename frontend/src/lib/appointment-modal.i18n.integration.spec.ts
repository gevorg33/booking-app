import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';
import { allAppointmentDetailI18nKeys } from './booking-detail-panel.util';
import { allBlockScheduleI18nKeys } from './block-schedule.util';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

function resolve(messages: ReturnType<typeof getMessages>, key: string): string {
  return translate(messages, key);
}

function expectNonEmpty(value: string, key: string, locale: AppLocale) {
  expect(value, `${locale}:${key}`).not.toBe(key);
  expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
}

describe('appointment modal i18n integration', () => {
  it('resolves every appointment detail modal key in en, hy, and ru', () => {
    const keys = [...new Set([...allAppointmentDetailI18nKeys(), ...allBlockScheduleI18nKeys()])];

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = resolve(messages, key);
        expectNonEmpty(value, key, locale);
      }
    }
  });

  it('returns Armenian copy for core appointment modal labels', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'appointments.detailTitle')).toContain('Ամրագրման');
    expect(resolve(hy, 'schedule.applyBlockSchedule')).toContain('Կիրառել');
    expect(resolve(hy, 'appointments.confirmCancel')).toContain('չեղարկ');
  });

  it('interpolates markStatusConfirm and service duration in all locales', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      const confirm = translate(messages, 'appointments.markStatusConfirm', {
        status: translate(messages, 'bookings.statusCompleted'),
      });
      expect(confirm).toContain(translate(messages, 'bookings.statusCompleted'));
      expect(confirm).not.toContain('{status}');

      const duration = translate(messages, 'appointments.serviceDurationMin', {
        minutes: 45,
      });
      expect(duration).toContain('45');
      expect(duration).not.toContain('{minutes}');
    }
  });
});
