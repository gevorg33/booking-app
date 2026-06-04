import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import type { AppLocale } from '@shared-i18n/types';
import { getMessages } from '../i18n/catalog';
import { allProviderAppI18nKeys } from './provider-app-i18n';
import { buildProviderAiExamples } from './provider-ai-examples';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

function resolve(messages: ReturnType<typeof getMessages>, key: string, vars?: Record<string, string | number>) {
  return translate(messages, key, vars);
}

function expectNonEmpty(value: string, key: string, locale: AppLocale) {
  expect(value, `${locale}:${key}`).not.toBe(key);
  expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
}

describe('provider app i18n integration', () => {
  it('resolves every wired provider app key in en, hy, and ru', () => {
    const keys = allProviderAppI18nKeys();
    expect(keys.length).toBeGreaterThan(100);

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        expectNonEmpty(resolve(messages, key), key, locale);
      }
    }
  });

  it('interpolates placeholder keys in all locales', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      expect(resolve(messages, 'provider.helloName', { name: 'Anna' })).toContain('Anna');
      expect(resolve(messages, 'provider.assistantPreviewMore', { count: 3 })).toContain('3');
      expect(resolve(messages, 'provider.assistantConfirmChanges', { count: 2 })).toContain('2');
      expect(resolve(messages, 'provider.inviteJoinBusiness', { business: 'Salon', role: 'provider' })).toContain(
        'Salon',
      );
      expect(resolve(messages, 'appointments.markStatusConfirm', { status: 'Done' })).toContain('Done');
      expect(resolve(messages, 'appointments.paymentLoyaltyPoints', { points: '10.00' })).toContain('10');
    }
  });

  it('returns Armenian AI assistant and thinking copy', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'ai.thinking')).toBe('Մտածում…');
    expect(resolve(hy, 'provider.assistantTitle')).toContain('AI');
    expect(resolve(hy, 'provider.suggestionsTitle')).toContain('առաջարկ');
  });

  it('builds four localized AI example prompts per locale', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      const tr = (key: string) => translate(messages, key);
      const examples = buildProviderAiExamples(tr);
      expect(examples).toHaveLength(4);
      for (const example of examples) {
        expect(example.trim().length).toBeGreaterThan(10);
      }
    }
  });
});
