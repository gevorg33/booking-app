import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';
import {
  AI_ASSISTANT_UI_KEYS,
  allAiAssistantI18nKeys,
  allAiAssistantPromptKeys,
  buildAiCommandBarExamples,
  getLocalizedAiPageSuggestionGroups,
  getLocalizedPageSuggestions,
  type AiExampleTenantContext,
  type AiTranslateFn,
} from './ai-assistant-i18n';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

function resolve(messages: ReturnType<typeof getMessages>, key: string): string {
  return translate(messages, key);
}

function tFor(locale: AppLocale): AiTranslateFn {
  const messages = getMessages(locale);
  return (key, vars) => translate(messages, key, vars);
}

function expectNonEmpty(value: string, key: string, locale: AppLocale) {
  expect(value, `${locale}:${key}`).not.toBe(key);
  expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
}

describe('ai assistant i18n integration', () => {
  it('resolves every AI assistant UI and prompt key in en, hy, and ru', () => {
    const keys = allAiAssistantI18nKeys();
    expect(keys.length).toBeGreaterThan(AI_ASSISTANT_UI_KEYS.length);

    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      for (const key of keys) {
        const value = resolve(messages, key);
        expectNonEmpty(value, key, locale);
      }
    }
  });

  it('returns Armenian empty-state and panel copy', () => {
    const hy = getMessages('hy');
    expect(resolve(hy, 'ai.emptyHint')).toContain('գործառնական');
    expect(resolve(hy, 'ai.panelTitle')).toContain('Orchestrix');
    expect(resolve(hy, 'ai.runWithAi')).toContain('Orchestrix');
    expect(resolve(hy, 'ai.thinking')).toBe('Մտածում…');
    expect(resolve(hy, 'public.thinking')).toBe('Մտածում…');
    expect(resolve(hy, 'ai.briefingPreparing')).toContain('ամփոփում');
    expect(resolve(hy, 'ai.autopilotSave')).toContain('autopilot');
  });

  it('interpolates placeholder and command-bar examples in all locales', () => {
    const ctx: AiExampleTenantContext = {
      employees: [
        { id: 'e1', name: '  ', isActive: true },
        { id: 'e2', name: 'Anna', serviceIds: ['s2'], isActive: true },
        { id: 'e3', name: 'Bob', isActive: false },
      ],
      services: [
        { id: 's1', name: 'Haircut', isActive: true },
        { id: 's2', name: 'Massage', isActive: true },
        { id: 's3', name: '', isActive: true },
      ],
    };

    for (const locale of LOCALES) {
      const tr = tFor(locale);
      const placeholder = tr('ai.inputPlaceholderExample', { provider: 'Anna' });
      expect(placeholder).toContain('Anna');
      expect(placeholder).not.toContain('{provider}');

      const examples = buildAiCommandBarExamples(ctx, tr);
      expect(examples).toHaveLength(7);
      const withNames = examples.find((e) => e.includes('Anna'));
      expect(withNames).toBeTruthy();
      const withService = examples.find((e) => e.includes('Massage'));
      expect(withService).toBeTruthy();
    }
  });

  it('buildAiCommandBarExamples uses fallbacks without tenant context', () => {
    const en = tFor('en');
    const fromNull = buildAiCommandBarExamples(null, en);
    const fromUndefined = buildAiCommandBarExamples(undefined, en);
    expect(fromNull).toEqual(fromUndefined);
    expect(fromNull).toHaveLength(7);
    expect(fromNull[2]).toContain(en('ai.fallbackProvider'));
    expect(fromNull[6]).toContain(en('ai.fallbackService'));
    expect(fromNull[6]).toContain(en('ai.fallbackProvider'));
  });

  it('buildAiCommandBarExamples picks first active service when assignment does not match', () => {
    const tr = tFor('en');
    const examples = buildAiCommandBarExamples(
      {
        employees: [{ id: 'e1', name: 'Sam', serviceIds: ['missing'], isActive: true }],
        services: [{ id: 's1', name: 'Facial', isActive: true }],
      },
      tr,
    );
    expect(examples[6]).toContain('Facial');
    expect(examples[6]).toContain('Sam');
  });

  it('buildAiCommandBarExamples skips inactive employees and services', () => {
    const tr = tFor('en');
    const examples = buildAiCommandBarExamples(
      {
        employees: [{ id: 'e1', name: 'Hidden', isActive: false }],
        services: [{ id: 's1', name: 'Hidden svc', isActive: false }],
      },
      tr,
    );
    expect(examples[2]).toContain(tr('ai.fallbackProvider'));
    expect(examples[6]).toContain(tr('ai.fallbackService'));
  });

  it('getLocalizedPageSuggestions returns route prompts and fallback for unknown routes', () => {
    const en = tFor('en');
    const bookings = getLocalizedPageSuggestions('/dashboard/bookings', en);
    expect(bookings.length).toBeGreaterThan(5);
    expect(bookings[0]).toBe(en('ai.prompts.howManyToday'));

    const fallback = getLocalizedPageSuggestions('/dashboard/unknown-route', en);
    expect(fallback).toHaveLength(4);
    expect(fallback[0]).toBe(en('ai.prompts.howManyToday'));
  });

  it('getLocalizedAiPageSuggestionGroups returns grouped and flat suggestion panels', () => {
    const hy = tFor('hy');
    const grouped = getLocalizedAiPageSuggestionGroups('/dashboard/bookings', hy);
    expect(grouped).toHaveLength(3);
    expect(grouped[0].label).toBe(hy('ai.groupLabels.bookingsOverview'));
    expect(grouped[0].items.length).toBe(3);
    expect(grouped[2].items.some((item) => item.includes('ամրագր'))).toBe(true);

    const customers = getLocalizedAiPageSuggestionGroups('/dashboard/customers', hy);
    expect(customers).toHaveLength(2);
    expect(customers[0].label).toBe(hy('ai.groupLabels.customersRetention'));
    expect(customers[0].items.some((item) => item.includes('չհայտնված') || item.includes('no-show'))).toBe(
      true,
    );
    expect(
      customers[0].items.some((item) => item.includes('անգործուն') || item.toLowerCase().includes('inactive')),
    ).toBe(true);

    const reports = getLocalizedAiPageSuggestionGroups('/dashboard/reports', hy);
    expect(reports[0].items[0]).toBe(hy('ai.prompts.explainUtilizationDrop'));

    const guide = getLocalizedAiPageSuggestionGroups('/dashboard/guide', hy);
    expect(guide).toHaveLength(1);
    expect(guide[0].id).toBe('commands');
    expect(guide[0].label).toBe(hy('ai.quickCommands'));
  });

  it('exports stable key registries', () => {
    const prompts = allAiAssistantPromptKeys();
    expect(prompts).toContain('ai.prompts.howManyToday');
    expect(prompts).toContain('ai.groupLabels.bookingsOverview');

    const all = allAiAssistantI18nKeys();
    for (const uiKey of AI_ASSISTANT_UI_KEYS) {
      expect(all).toContain(uiKey);
    }
  });
});
