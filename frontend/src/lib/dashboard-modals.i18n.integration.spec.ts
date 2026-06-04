import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';
import { allDashboardModalI18nKeys } from './dashboard-modals.i18n';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

function resolve(messages: ReturnType<typeof getMessages>, key: string): string {
  return translate(messages, key);
}

function expectNonEmpty(value: string, key: string, locale: AppLocale) {
  expect(value, `${locale}:${key}`).not.toBe(key);
  expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
}

describe('dashboard modals i18n integration', () => {
  it('resolves every dashboard modal key in en, hy, and ru', () => {
    const keys = allDashboardModalI18nKeys();

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = resolve(messages, key);
        expectNonEmpty(value, key, locale);
      }
    }
  });

  it('returns Armenian copy for core dashboard modal labels', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'employees.addEmployee')).toContain('Ավելացնել');
    expect(resolve(hy, 'customers.detailTitle')).toContain('Հաճախորդ');
    expect(resolve(hy, 'support.navLabel')).toBe('Աջակցություն');
    expect(resolve(hy, 'invite.sendInviteModalBody')).toContain('Հրավիրեք');
  });

  it('interpolates customer and employee modal strings in all locales', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);

      const subscription = translate(messages, 'customers.subscriptionAppointmentsLeft', {
        remaining: 2,
        included: 5,
        date: '2026-06-01',
      });
      expect(subscription).toContain('2');
      expect(subscription).toContain('5');
      expect(subscription).toContain('2026-06-01');
      expect(subscription).not.toContain('{remaining}');

      const usage = translate(messages, 'customers.usageRow', {
        date: '2026-05-01',
        count: 3,
      });
      expect(usage).toContain('2026-05-01');
      expect(usage).toContain('3');
      expect(usage).not.toContain('{date}');

      const withProvider = translate(messages, 'customers.withProvider', { name: 'Anna' });
      expect(withProvider).toContain('Anna');
      expect(withProvider).not.toContain('{name}');

      const deactivate = translate(messages, 'employees.deactivateModalBody', { name: 'Sam' });
      expect(deactivate).toContain('Sam');
      expect(deactivate).not.toContain('{name}');
    }
  });

  it('exports a stable key registry for modal components', () => {
    const keys = allDashboardModalI18nKeys();
    expect(keys).toContain('employees.formSubtitle');
    expect(keys).toContain('support.submitTicket');
    expect(keys.length).toBeGreaterThan(40);
  });
});
