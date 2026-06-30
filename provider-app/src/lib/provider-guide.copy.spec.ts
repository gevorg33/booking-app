import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import en from '@shared-i18n/messages/en';
import { getMessages } from '../i18n/catalog';
import { listProviderGuideUiI18nKeys } from './provider-app-i18n.js';
import { providerMobileGuide } from './mobile-guide/index.ts';
import {
  PROVIDER_GUIDE_COPY_SCENARIOS,
  PROVIDER_GUIDE_UI_COPY_KEYS,
} from './provider-guide.copy.fixtures.js';
import {
  assertProviderGuideCopyLocaleCoverage,
  buildProviderGuideCopyScenarios,
  listProviderGuideCopyKeysForTopic,
  providerGuideLocaleHasScript,
  resolveProviderGuideCopyKey,
} from './provider-guide.copy.util.js';

describe('provider guide copy parity (ai-guide-1.9.10)', () => {
  const bundle = providerMobileGuide.bundle;

  it('indexes every bundled provider topicId', () => {
    expect(PROVIDER_GUIDE_COPY_SCENARIOS.length).toBeGreaterThanOrEqual(10);
    expect(buildProviderGuideCopyScenarios(bundle)).toEqual(PROVIDER_GUIDE_COPY_SCENARIOS);
  });

  it('lists guide UI keys in provider-app-i18n namespace', () => {
    expect(PROVIDER_GUIDE_UI_COPY_KEYS).toEqual(listProviderGuideUiI18nKeys());
    expect(PROVIDER_GUIDE_UI_COPY_KEYS).toContain('provider.guidePageTitle');
  });

  it.each(['en', 'hy', 'ru'] as const)(
    'covers all provider guide flow keys in %s',
    (locale) => {
      expect(() => assertProviderGuideCopyLocaleCoverage(bundle, locale)).not.toThrow();
    },
  );

  it.each(PROVIDER_GUIDE_COPY_SCENARIOS.map((row) => [row.id, row] as const))(
    'resolves every i18n key for topic %s',
    (_id, scenario) => {
      for (const key of listProviderGuideCopyKeysForTopic(bundle, scenario.topicId)) {
        for (const locale of ['en', 'hy', 'ru'] as const) {
          const resolved = resolveProviderGuideCopyKey(bundle, locale, key);
          expect(resolved, `${scenario.topicId} missing ${key} (${locale})`).toBeTruthy();
          expect(resolved!.trim().length).toBeGreaterThan(0);
        }
      }
    },
  );

  it.each(PROVIDER_GUIDE_COPY_SCENARIOS.map((row) => [row.id, row] as const))(
    'localizes HY title and summary for topic %s',
    (_id, scenario) => {
      const titleEn = resolveProviderGuideCopyKey(bundle, 'en', scenario.titleKey);
      const titleHy = resolveProviderGuideCopyKey(bundle, 'hy', scenario.titleKey);
      expect(titleHy).toBeTruthy();
      expect(providerGuideLocaleHasScript('hy', titleHy!)).toBe(true);
      expect(titleHy).not.toBe(titleEn);

      if (scenario.summaryKey) {
        const summaryEn = resolveProviderGuideCopyKey(bundle, 'en', scenario.summaryKey);
        const summaryHy = resolveProviderGuideCopyKey(bundle, 'hy', scenario.summaryKey);
        expect(summaryHy).toBeTruthy();
        expect(providerGuideLocaleHasScript('hy', summaryHy!)).toBe(true);
        expect(summaryHy).not.toBe(summaryEn);
      }
    },
  );

  it.each(PROVIDER_GUIDE_COPY_SCENARIOS.map((row) => [row.id, row] as const))(
    'localizes RU title and summary for topic %s',
    (_id, scenario) => {
      const titleEn = resolveProviderGuideCopyKey(bundle, 'en', scenario.titleKey);
      const titleRu = resolveProviderGuideCopyKey(bundle, 'ru', scenario.titleKey);
      expect(titleRu).toBeTruthy();
      expect(providerGuideLocaleHasScript('ru', titleRu!)).toBe(true);
      expect(titleRu).not.toBe(titleEn);

      if (scenario.summaryKey) {
        const summaryEn = resolveProviderGuideCopyKey(bundle, 'en', scenario.summaryKey);
        const summaryRu = resolveProviderGuideCopyKey(bundle, 'ru', scenario.summaryKey);
        expect(summaryRu).toBeTruthy();
        expect(providerGuideLocaleHasScript('ru', summaryRu!)).toBe(true);
        expect(summaryRu).not.toBe(summaryEn);
      }
    },
  );

  it('ships guide UI chrome in provider-app-i18n for EN/HY/RU', () => {
    for (const locale of ['en', 'hy', 'ru'] as const) {
      const messages = getMessages(locale);
      for (const key of PROVIDER_GUIDE_UI_COPY_KEYS) {
        const value = translate(messages, key);
        expect(value.trim().length).toBeGreaterThan(0);
        expect(value).not.toBe(key);
      }
    }

    const hy = getMessages('hy');
    const ru = getMessages('ru');
    for (const key of PROVIDER_GUIDE_UI_COPY_KEYS) {
      const enValue = translate(en, key);
      const hyValue = translate(hy, key);
      const ruValue = translate(ru, key);
      expect(hyValue).not.toBe(enValue);
      expect(ruValue).not.toBe(enValue);
      expect(providerGuideLocaleHasScript('hy', hyValue)).toBe(true);
      expect(providerGuideLocaleHasScript('ru', ruValue)).toBe(true);
    }
  });
});
