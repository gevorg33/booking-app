import { describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import {
  getOnboardingCommandBarExamples,
  getOnboardingPageSuggestionGroups,
  onboardingPromptI18nKeys,
} from './ai-onboarding.util';

function tFor(locale: 'en' | 'hy' | 'ru') {
  const messages = getMessages(locale);
  return (key: string) => translate(messages, key);
}

describe('ai-onboarding.util', () => {
  it('returns step-specific guided panel groups', () => {
    const en = tFor('en');
    const typeGroups = getOnboardingPageSuggestionGroups('type', en);
    expect(typeGroups).toHaveLength(1);
    expect(typeGroups[0].id).toBe('guided');
    expect(typeGroups[0].items.length).toBe(3);
    expect(typeGroups[0].items[0]).toContain('starter');

    const scheduleGroups = getOnboardingPageSuggestionGroups('schedule', en);
    expect(scheduleGroups[0].items.some((item) => /schedule/i.test(item))).toBe(true);
  });

  it('returns step-specific command bar examples', () => {
    const en = tFor('en');
    expect(getOnboardingCommandBarExamples('link', en)).toHaveLength(3);
    expect(getOnboardingCommandBarExamples('done', en)[0]).toContain('appointment');
  });

  it('falls back to type step for unknown step keys', () => {
    const en = tFor('en');
    const unknown = getOnboardingPageSuggestionGroups('unknown' as 'type', en);
    const type = getOnboardingPageSuggestionGroups('type', en);
    expect(unknown).toEqual(type);
    expect(getOnboardingCommandBarExamples('unknown' as 'type', en)).toEqual(
      getOnboardingCommandBarExamples('type', en),
    );
  });

  it('registers onboarding i18n keys', () => {
    const keys = onboardingPromptI18nKeys();
    expect(keys).toContain('onboarding.aiGuidedTitle');
    expect(keys).toContain('ai.prompts.onboardingSuggestCatalog');
    for (const locale of ['en', 'hy', 'ru'] as const) {
      const tr = tFor(locale);
      for (const key of keys) {
        const value = tr(key);
        expect(value).not.toBe(key);
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
