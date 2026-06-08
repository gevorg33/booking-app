import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import type { AppLocale } from '@shared-i18n/types';
import { getMessages } from '../i18n/catalog';
import { listClinicLabStateI18nKeys } from '@booking-lib/clinic-i18n';
import {
  allProviderAppI18nKeys,
  listProviderClinicTasksI18nKeys,
  listProviderLabCollectionI18nKeys,
  listProviderLabResultsI18nKeys,
} from './provider-app-i18n';
import { providerQuickChipI18nKeys } from './provider-ai-quick-chips';
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
    const keys = [...new Set([...allProviderAppI18nKeys(), ...providerQuickChipI18nKeys()])];
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

  it('resolves provider lab results tab keys in en, hy, and ru (i18n-clinic-v2-4)', () => {
    const keys = listProviderLabResultsI18nKeys();
    expect(keys).toContain('provider.labResultsTitle');
    expect(keys).toContain('clinic.labState.result.Released');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        expectNonEmpty(resolve(messages, key), key, locale);
      }
    }
  });

  it('resolves provider lab collection queue keys in en, hy, and ru (i18n-clinic-v2-2)', () => {
    const keys = listProviderLabCollectionI18nKeys();
    expect(keys).toContain('provider.labCollectionTitle');
    expect(keys).toContain('clinic.labState.order.NotCollected');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        expectNonEmpty(resolve(messages, key), key, locale);
      }
    }
  });

  it('resolves provider clinic task inbox keys in en, hy, and ru (i18n-clinic-v2-9)', () => {
    const keys = listProviderClinicTasksI18nKeys();
    expect(keys).toContain('provider.clinicTasksTypeResultReview');
    expect(keys).toContain('provider.clinicTasksTypeSpecimenCollection');
    expect(keys).toContain('provider.clinicTasksTypePatientCallback');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        expectNonEmpty(resolve(messages, key), key, locale);
      }
    }
  });

  it('localizes clinic task inbox types and actions in hy and ru (i18n-clinic-v2-9)', () => {
    const hy = getMessages('hy');
    const ru = getMessages('ru');
    expect(resolve(hy, 'provider.clinicTasksTypeSpecimenCollection')).toContain('հավաքում');
    expect(resolve(ru, 'provider.clinicTasksTypePatientCallback')).toContain('звонок');
    expect(resolve(hy, 'provider.clinicTasksClaim')).toBe('Վերցնել');
    expect(resolve(ru, 'provider.navClinicTasks')).toBe('Задачи');
  });

  it('resolves every clinic.labState badge and gate key in en, hy, and ru', () => {
    const keys = listClinicLabStateI18nKeys();
    expect(keys).toContain('clinic.labState.gate.disabledReason');
    expect(keys).toContain('clinic.labState.result.Released');

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        expectNonEmpty(resolve(messages, key), key, locale);
      }
    }
  });

  it('returns Armenian AI assistant and thinking copy', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'ai.thinking')).toBe('Մտածում…');
    expect(resolve(hy, 'provider.assistantTitle')).toContain('AI');
    expect(resolve(hy, 'provider.suggestionsTitle')).toContain('առաջարկ');
  });

  it('builds localized AI example prompts per locale', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      const tr = (key: string) => translate(messages, key);
      const examples = buildProviderAiExamples(tr);
      expect(examples.length).toBeGreaterThanOrEqual(4);
      for (const example of examples) {
        expect(example.trim().length).toBeGreaterThan(10);
      }
    }
  });
});
