import { describe, expect, it } from 'vitest';
import {
  CONSUMER_COPY_EN,
  CONSUMER_COPY_HY,
  CONSUMER_COPY_LOCALES,
  CONSUMER_COPY_RU,
  getConsumerCopy,
} from './consumer-copy-catalog.js';
import { consumerMobileGuide } from './mobile-guide/index.ts';
import {
  CONSUMER_GUIDE_COPY_SCENARIOS,
  CONSUMER_GUIDE_UI_COPY_KEYS,
} from './consumer-guide.copy.fixtures.js';
import {
  assertConsumerGuideCopyLocaleCoverage,
  buildConsumerGuideCopyScenarios,
  consumerGuideLocaleHasScript,
  listConsumerGuideCopyKeysForTopic,
  resolveConsumerGuideCopyKey,
} from './consumer-guide.copy.util.js';

describe('consumer guide copy parity (ai-guide-1.9.4)', () => {
  const bundle = consumerMobileGuide.bundle;

  it('indexes every bundled consumer topicId', () => {
    expect(CONSUMER_GUIDE_COPY_SCENARIOS.length).toBeGreaterThanOrEqual(11);
    expect(buildConsumerGuideCopyScenarios(bundle)).toEqual(CONSUMER_GUIDE_COPY_SCENARIOS);
  });

  it.each(['en', 'hy', 'ru'] as const)(
    'covers all consumer guide flow keys in %s',
    (locale) => {
      expect(() => assertConsumerGuideCopyLocaleCoverage(bundle, locale)).not.toThrow();
    },
  );

  it.each(CONSUMER_GUIDE_COPY_SCENARIOS.map((row) => [row.id, row] as const))(
    'resolves every i18n key for topic %s',
    (_id, scenario) => {
      for (const key of listConsumerGuideCopyKeysForTopic(bundle, scenario.topicId)) {
        for (const locale of ['en', 'hy', 'ru'] as const) {
          const resolved = resolveConsumerGuideCopyKey(bundle, locale, key);
          expect(resolved, `${scenario.topicId} missing ${key} (${locale})`).toBeTruthy();
          expect(resolved!.trim().length).toBeGreaterThan(0);
        }
      }
    },
  );

  it.each(CONSUMER_GUIDE_COPY_SCENARIOS.map((row) => [row.id, row] as const))(
    'localizes HY title and summary for topic %s',
    (_id, scenario) => {
      const titleEn = resolveConsumerGuideCopyKey(bundle, 'en', scenario.titleKey);
      const titleHy = resolveConsumerGuideCopyKey(bundle, 'hy', scenario.titleKey);
      expect(titleHy).toBeTruthy();
      expect(consumerGuideLocaleHasScript('hy', titleHy!)).toBe(true);
      expect(titleHy).not.toBe(titleEn);

      if (scenario.summaryKey) {
        const summaryEn = resolveConsumerGuideCopyKey(bundle, 'en', scenario.summaryKey);
        const summaryHy = resolveConsumerGuideCopyKey(bundle, 'hy', scenario.summaryKey);
        expect(summaryHy).toBeTruthy();
        expect(consumerGuideLocaleHasScript('hy', summaryHy!)).toBe(true);
        expect(summaryHy).not.toBe(summaryEn);
      }
    },
  );

  it.each(CONSUMER_GUIDE_COPY_SCENARIOS.map((row) => [row.id, row] as const))(
    'localizes RU title and summary for topic %s',
    (_id, scenario) => {
      const titleEn = resolveConsumerGuideCopyKey(bundle, 'en', scenario.titleKey);
      const titleRu = resolveConsumerGuideCopyKey(bundle, 'ru', scenario.titleKey);
      expect(titleRu).toBeTruthy();
      expect(consumerGuideLocaleHasScript('ru', titleRu!)).toBe(true);
      expect(titleRu).not.toBe(titleEn);

      if (scenario.summaryKey) {
        const summaryEn = resolveConsumerGuideCopyKey(bundle, 'en', scenario.summaryKey);
        const summaryRu = resolveConsumerGuideCopyKey(bundle, 'ru', scenario.summaryKey);
        expect(summaryRu).toBeTruthy();
        expect(consumerGuideLocaleHasScript('ru', summaryRu!)).toBe(true);
        expect(summaryRu).not.toBe(summaryEn);
      }
    },
  );

  it('ships guide UI chrome in consumer-copy-catalog for EN/HY/RU', () => {
    for (const locale of CONSUMER_COPY_LOCALES) {
      const copy = getConsumerCopy(locale);
      for (const key of CONSUMER_GUIDE_UI_COPY_KEYS) {
        expect(copy[key].trim().length).toBeGreaterThan(0);
      }
    }

    for (const key of CONSUMER_GUIDE_UI_COPY_KEYS) {
      expect(CONSUMER_COPY_HY[key]).not.toBe(CONSUMER_COPY_EN[key]);
      expect(CONSUMER_COPY_RU[key]).not.toBe(CONSUMER_COPY_EN[key]);
      expect(consumerGuideLocaleHasScript('hy', CONSUMER_COPY_HY[key])).toBe(true);
      expect(consumerGuideLocaleHasScript('ru', CONSUMER_COPY_RU[key])).toBe(true);
    }
  });
});
