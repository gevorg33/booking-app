import {
  E2E85_MISSING_LOCALE_DEFAULT,
  E2E85_REQUEST_LOCALE_CASES,
} from './ai-e2e85-rtl-locale-threading.fixtures.js';
import { handleExplainRtlLayoutLogic } from './ai-explain-rtl-layout.logic.js';
import {
  mergeExplainRtlLayoutRequestLocale,
  resolveDocumentDirection,
  resolveRtlLayoutLocale,
} from './ai-explain-rtl-layout.util.js';

describe('e2e-bug.85 explain_rtl_layout uses request/session locale', () => {
  it.each(E2E85_REQUEST_LOCALE_CASES)(
    '$id: resolveRtlLayoutLocale / direction honor $locale',
    ({ locale, expectedDirection }) => {
      expect(resolveRtlLayoutLocale({ locale })).toBe(locale);
      expect(resolveDocumentDirection({ locale })).toBe(expectedDirection);
    },
  );

  it('resolveRtlLayoutLocale falls back to _requestLocale when locale unset', () => {
    expect(resolveRtlLayoutLocale({ _requestLocale: 'hy' })).toBe('hy');
    expect(resolveRtlLayoutLocale({})).toBe('en');
  });

  it('mergeExplainRtlLayoutRequestLocale prefers params then request locale', () => {
    expect(
      mergeExplainRtlLayoutRequestLocale({ locale: 'ru' }, 'hy').locale,
    ).toBe('ru');
    expect(mergeExplainRtlLayoutRequestLocale({}, 'hy').locale).toBe('hy');
    expect(
      mergeExplainRtlLayoutRequestLocale({ _requestLocale: 'hy' }).locale,
    ).toBe('hy');
  });

  it.each(E2E85_REQUEST_LOCALE_CASES)(
    '$id: handler summary reflects locale (not hardcoded EN)',
    async ({ prompt, locale, expectedLocaleLabel, expectedDirection }) => {
      const result = await handleExplainRtlLayoutLogic(
        'biz-1',
        { locale },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.locale).toBe(locale);
      expect(result.details?.documentDirection).toBe(expectedDirection);
      if (expectedLocaleLabel) {
        expect(result.summary).toContain(
          `${expectedLocaleLabel} uses left-to-right`,
        );
      } else {
        // Arabic: RTL direction note, not the EN LTR template.
        expect(result.summary).not.toContain('EN uses left-to-right');
        expect(result.summary).toMatch(/Right-to-left \(RTL\)/i);
      }
    },
  );

  it(`${E2E85_MISSING_LOCALE_DEFAULT.id}: defaults to en only when unset`, async () => {
    const result = await handleExplainRtlLayoutLogic(
      'biz-1',
      {},
      E2E85_MISSING_LOCALE_DEFAULT.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.details?.locale).toBe('en');
    expect(result.summary).toContain(
      `${E2E85_MISSING_LOCALE_DEFAULT.expectedLocaleLabel} uses left-to-right`,
    );
  });

  it('hy via _requestLocale (customer session thread shape) is not EN', async () => {
    const result = await handleExplainRtlLayoutLogic(
      'biz-1',
      { _requestLocale: 'hy' },
      'What is RTL?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.locale).toBe('hy');
    expect(result.summary).toContain('HY uses left-to-right');
    expect(result.summary).not.toMatch(/\bEN uses left-to-right\b/);
  });
});
