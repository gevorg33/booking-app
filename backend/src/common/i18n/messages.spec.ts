import { resolveLocale, t } from './messages.js';

describe('backend i18n messages', () => {
  it('resolves hy and ru locales', () => {
    expect(resolveLocale('hy')).toBe('hy');
    expect(resolveLocale('ru')).toBe('ru');
    expect(resolveLocale('de')).toBe('en');
  });

  it('translates email reminder windows per locale', () => {
    expect(t('en', 'email.reminderHours', { count: 6 })).toBe('6 hours');
    expect(t('hy', 'email.reminderHours', { count: 6 })).toBe('6 ժամ');
    expect(t('ru', 'email.reminderMinutes', { count: 30 })).toBe('30 мин');
  });

  it('falls back to English for missing keys in hy', () => {
    expect(t('hy', 'email.nonexistentKey')).toBe('email.nonexistentKey');
  });
});
