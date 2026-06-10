import { describe, expect, it } from 'vitest';
import {
  CONSUMER_COPY_EN,
  CONSUMER_COPY_HY,
  CONSUMER_COPY_RU,
  CONSUMER_COPY_LOCALES,
  CONSUMER_DISCOVERY_CHIP_COPY_CATALOG,
  getConsumerCopy,
} from './consumer-copy-catalog.js';
import { consumerCopyForLocale, formatCopy } from './copy.js';

describe('consumer-copy-catalog', () => {
  it('returns a full catalog for each supported locale', () => {
    for (const locale of CONSUMER_COPY_LOCALES) {
      const copy = getConsumerCopy(locale);
      expect(copy.myResultsTitle.length).toBeGreaterThan(0);
      expect(copy.myLabToBookTitle.length).toBeGreaterThan(0);
      expect(copy.myLabToBookBookCollection.length).toBeGreaterThan(0);
      expect(copy.myDocumentCategories.lab_report.length).toBeGreaterThan(0);
    }
  });

  it('keeps EN/HY/RU key parity', () => {
    const enKeys = Object.keys(CONSUMER_COPY_EN).sort();
    expect(Object.keys(CONSUMER_COPY_HY).sort()).toEqual(enKeys);
    expect(Object.keys(CONSUMER_COPY_RU).sort()).toEqual(enKeys);
  });

  it('localizes clinic-facing strings', () => {
    expect(getConsumerCopy('hy').myResultsTitle).toBe('Իմ արդյունքները');
    expect(getConsumerCopy('ru').measurementFlagAbnormal).toBe('Отклонение');
    expect(getConsumerCopy('en').publicIntakeSkip).toBe('Skip for now');
  });

  it('localizes optional pre-visit intake checkout copy in hy and ru (i18n-clinic-v2-8)', () => {
    expect(getConsumerCopy('hy').publicIntakeCheckoutTitle).toContain('Նախապոստ');
    expect(getConsumerCopy('hy').publicIntakeContinueToBooking).toContain('գրանցում');
    expect(getConsumerCopy('ru').publicIntakeCheckoutTitle).toContain('перед визитом');
    expect(getConsumerCopy('ru').publicIntakeStart).toContain('анкету');
    expect(getConsumerCopy('en').publicIntakeAnswerLabel).toBe('Your answer');
  });

  it('localizes consumer my results tab copy in hy and ru (i18n-clinic-v2-4)', () => {
    expect(getConsumerCopy('hy').myResultsTab).toBe('Արդյունքներ');
    expect(getConsumerCopy('hy').myResultsEmpty).toContain('Ազատված');
    expect(getConsumerCopy('ru').myResultsTitle).toBe('Мои результаты');
    expect(getConsumerCopy('ru').myResultsReleasedOn).toBe('Выпущен');
    expect(getConsumerCopy('ru').myResultsUnnamed).toBe('Результат анализа');
  });

  it('documents discover assistant chip prompts in EN copy (discover-exit-4)', () => {
    for (const row of CONSUMER_DISCOVERY_CHIP_COPY_CATALOG) {
      expect(CONSUMER_COPY_EN[row.labelKey]).toBe(row.en.label);
      expect(CONSUMER_COPY_EN[row.promptKey]).toBe(row.en.prompt);
    }
  });

  it('resolves locale from tenant preference with EN fallback', () => {
    expect(consumerCopyForLocale('hy').myResultsTab).toBe(getConsumerCopy('hy').myResultsTab);
    expect(consumerCopyForLocale('xx').myResultsTab).toBe(CONSUMER_COPY_EN.myResultsTab);
  });

  it('interpolates template variables', () => {
    expect(
      formatCopy(CONSUMER_COPY_EN.myResultsSignInPrompt, { name: 'City Lab' }),
    ).toContain('City Lab');
    expect(formatCopy('Hello {name}', {})).toBe('Hello ');
  });
});
