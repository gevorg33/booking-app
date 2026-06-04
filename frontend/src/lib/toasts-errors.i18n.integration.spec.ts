import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';
import { allToastsErrorsI18nKeys } from './toasts-errors.i18n';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

function resolve(messages: ReturnType<typeof getMessages>, key: string): string {
  return translate(messages, key);
}

describe('toasts and errors i18n integration', () => {
  it('resolves every toast and error key in en, hy, and ru', () => {
    const keys = allToastsErrorsI18nKeys();
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = resolve(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('returns localized feedback toast copy', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'feedback.created')).toContain('ստեղծվեց');
    expect(resolve(hy, 'feedback.failed')).toContain('սխալ');
    expect(resolve(hy, 'errors.uploadImageFailed')).toContain('լուսանկար');
  });

  it('resolves public and AI error fallbacks in Armenian', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'ai.approvePlanFailed')).toContain('պլան');
    expect(resolve(hy, 'public.missingAppointmentSchedule')).toContain('ժամանակացույց');
  });
});
