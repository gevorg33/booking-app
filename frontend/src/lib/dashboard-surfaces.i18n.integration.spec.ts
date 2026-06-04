import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';
import {
  AI_DASHBOARD_SURFACE_KEYS,
  INTEGRATIONS_SURFACE_KEYS,
  MISC_DASHBOARD_SURFACE_KEYS,
  MONETIZATION_SURFACE_KEYS,
  allDashboardSurfaceI18nKeys,
} from './dashboard-surfaces.i18n';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

function resolve(messages: ReturnType<typeof getMessages>, key: string): string {
  return translate(messages, key);
}

function expectNonEmpty(value: string, key: string, locale: AppLocale) {
  expect(value, `${locale}:${key}`).not.toBe(key);
  expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
}

describe('dashboard surfaces i18n integration', () => {
  it('resolves every dashboard surface key in en, hy, and ru', () => {
    const keys = allDashboardSurfaceI18nKeys();
    expect(keys.length).toBeGreaterThan(80);

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        expectNonEmpty(resolve(messages, key), key, locale);
      }
    }
  });

  it('returns Armenian copy for AI briefing and monetization surfaces', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'ai.briefingPreparing')).toContain('ամփոփում');
    expect(resolve(hy, 'ai.calendarBlock')).toBe('Արգելափակել');
    expect(resolve(hy, 'monetization.customMonths')).toContain('ամիս');
    expect(resolve(hy, 'integrations.saveZendesk')).toContain('Zendesk');
  });

  it('interpolates AI briefing and calendar prompts in all locales', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      const title = translate(messages, 'ai.briefingTitle', { date: '2026-06-02' });
      expect(title).toContain('2026-06-02');
      expect(title).not.toContain('{date}');

      const summary = translate(messages, 'ai.briefingSummary', {
        bookings: 5,
        utilization: 72,
      });
      expect(summary).toContain('5');
      expect(summary).toContain('72');

      const block = translate(messages, 'ai.calendarPromptBlock', {
        employeeName: 'Anna',
        date: '2026-06-03',
        timeFrom: '09:00',
        timeTo: '10:00',
      });
      expect(block).toContain('Anna');
      expect(block).not.toContain('{employeeName}');
    }
  });

  it('interpolates monetization pricing and loyalty strings', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      const regular = translate(messages, 'monetization.regularTotal', { amount: '120.00' });
      expect(regular).toContain('120.00');
      const sub = translate(messages, 'monetization.subscriptionPriceLabel', { amount: '99.00' });
      expect(sub).toContain('99.00');
      const months = translate(messages, 'monetization.durationMonthsShort', { count: 6 });
      expect(months).toContain('6');
      const hint = translate(messages, 'monetization.assignMultiPlanHint', { count: 3 });
      expect(hint).toContain('3');
      const example = translate(messages, 'monetization.loyaltyEarnExample', {
        percent: 10,
        amount: '1.00',
      });
      expect(example).toContain('10');
      expect(example).toContain('1.00');
    }
  });

  it('exports stable registries by surface area', () => {
    const all = allDashboardSurfaceI18nKeys();
    for (const key of AI_DASHBOARD_SURFACE_KEYS) {
      expect(all).toContain(key);
    }
    for (const key of MONETIZATION_SURFACE_KEYS) {
      expect(all).toContain(key);
    }
    for (const key of INTEGRATIONS_SURFACE_KEYS) {
      expect(all).toContain(key);
    }
    for (const key of MISC_DASHBOARD_SURFACE_KEYS) {
      expect(all).toContain(key);
    }
  });
});
